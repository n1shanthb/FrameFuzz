import {createHash} from 'node:crypto';
import {HYPOTHESIS_SCHEMA,validateHypothesis} from './hypothesis.mjs';
export const DEFAULT_OPENROUTER_MODEL='anthropic/claude-sonnet-4.6';
export const DEFAULT_LIMITS={maxCalls:6,maxTotalTokens:60000,maxCostUSD:0.50,maxOutputTokens:1600,maxInputBytes:48000,timeoutMs:45000};
export const MAX_LIMITS={...DEFAULT_LIMITS,maxCalls:12,maxCostUSD:1,maxTotalTokens:120000,maxOutputTokens:4000,maxInputBytes:65536,timeoutMs:120000};
export function describeBudgetGate(limits,{calls,tokens,costUSD,bytes,reserveTokens,reserveCost}){
  if(bytes>limits.maxInputBytes)return `OpenRouter input too large before request: inputBytes ${bytes} > maxInputBytes ${limits.maxInputBytes}`;
  if(calls>=limits.maxCalls)return `OpenRouter run call limit before request: calls ${calls} >= maxCalls ${limits.maxCalls}`;
  if(tokens+reserveTokens>limits.maxTotalTokens)return `OpenRouter run token budget exhausted before request: tokens ${tokens} + reserve ${reserveTokens} > maxTotalTokens ${limits.maxTotalTokens}`;
  if(costUSD+reserveCost>limits.maxCostUSD)return `OpenRouter run USD budget exhausted before request: costUSD ${costUSD.toFixed(6)} + reserve ${reserveCost.toFixed(6)} > maxCostUSD ${limits.maxCostUSD}`;
  return null;
}
const digest=x=>createHash('sha256').update(x).digest('hex');
const bounded=(n,min,max,name)=>{if(!Number.isFinite(n)||n<min||n>max)throw new Error('Invalid provider budget '+name);return n;};
const modelName=env=>!env.OPENROUTER_MODEL||env.OPENROUTER_MODEL.toLowerCase()==='sonnet'?DEFAULT_OPENROUTER_MODEL:env.OPENROUTER_MODEL;
export function openRouterStatus(env=process.env){return {provider:'OpenRouter',configured:Boolean(env.OPENROUTER_API_KEY),model:modelName(env),limits:DEFAULT_LIMITS};}
export class OpenRouterProvider {
 #key;
 constructor({env=process.env,fetchImpl=fetch,limits={},testTransport=false}={}){
  this.kind=testTransport?'MOCK_LLM_TRANSPORT':'OPENROUTER';this.model=modelName(env);
  if(!/^[a-zA-Z0-9._:/-]{1,160}$/.test(this.model))throw new Error('Invalid OpenRouter model ID');
  this.endpoint=env.OPENROUTER_ENDPOINT??'https://openrouter.ai/api/v1/chat/completions';const url=new URL(this.endpoint);
  if((url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))||url.username||url.password||url.search||url.hash)throw new Error('Provider endpoint must be a credential-free HTTPS URL (or local test endpoint)');
  this.#key=env.OPENROUTER_API_KEY;this.fetchImpl=fetchImpl;this.limits={...DEFAULT_LIMITS,...limits};
  for(const k of Object.keys(this.limits))if(!(k in DEFAULT_LIMITS))throw new Error('Unknown budget '+k);
  for(const [k,v]of Object.entries(this.limits))bounded(v,k==='maxCostUSD'?0.000001:1,MAX_LIMITS[k],k);
  for(const k of ['maxCalls','maxTotalTokens','maxOutputTokens','maxInputBytes','timeoutMs'])if(!Number.isSafeInteger(this.limits[k]))throw new Error('Integer budget required');
  this.logs=[];this.calls=0;this.tokens=0;this.costUSD=0;
 }
 protect(value){const raw=String(value);return (this.#key?raw.split(this.#key).join('[REDACTED]'):raw).replace(/sk-or-[\w-]+/g,'[REDACTED]');}
 async propose(messages){return this.structured(messages,{name:'framefuzz_hypothesis',schema:HYPOTHESIS_SCHEMA,validate:validateHypothesis});}
 quote(messages,schema){
  const input=JSON.stringify({messages,schema}),bytes=Buffer.byteLength(input);
  // Byte length overestimates tokens; reserve ~1 token / 4 bytes for input plus configured max output.
  const approxInputTokens=Math.ceil(bytes/4)+250;
  return {input,bytes,reserveTokens:approxInputTokens+this.limits.maxOutputTokens,reserveCost:approxInputTokens*5/1e6+this.limits.maxOutputTokens*25/1e6};
 }
 async structured(messages,{name,schema,validate,onResponse,signal}){
  if(signal?.aborted)throw new Error('CANCELLED');
  if(!this.#key)throw new Error('OPENROUTER_API_KEY is not configured');
  const {input,bytes,reserveTokens,reserveCost}=this.quote(messages,schema);
  const gate=describeBudgetGate(this.limits,{calls:this.calls,tokens:this.tokens,costUSD:this.costUSD,bytes,reserveTokens,reserveCost});
  if(gate)throw new Error(gate);
  this.calls++;this.tokens+=reserveTokens;this.costUSD+=reserveCost;
  const log={call:this.calls,role:name,provider:'OpenRouter',model:this.model,endpointHost:new URL(this.endpoint).host,promptDigest:digest(input),inputBytes:bytes,reservedTokens:reserveTokens,reservedCostUSD:reserveCost,state:'STARTED'};this.logs.push(log);
  const controller=new AbortController();let timer,abortListener;
  try{
   const task=(async()=>{const r=await this.fetchImpl(this.endpoint,{method:'POST',headers:{Authorization:`Bearer ${this.#key}`,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:this.model,messages,max_tokens:this.limits.maxOutputTokens,stream:false,reasoning:{enabled:false},provider:{require_parameters:true,max_price:{prompt:5,completion:25}},response_format:{type:'json_schema',json_schema:{name,strict:true,schema}}})});if(!r.ok)throw new Error('OpenRouter HTTP '+r.status);const body=await r.text();if(body.length>131072)throw new Error('OpenRouter response too large');return JSON.parse(body);})();
   const result=await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('OpenRouter request timeout'));},this.limits.timeoutMs);abortListener=()=>{controller.abort();reject(new Error('CANCELLED'));};signal?.addEventListener('abort',abortListener,{once:true});if(signal?.aborted)abortListener();})]);
   const usage=result.usage??{},tokens=usage.total_tokens??((usage.prompt_tokens??0)+(usage.completion_tokens??0)),cost=usage.cost;
   if(Number.isSafeInteger(tokens)&&tokens>0){this.tokens+=tokens-reserveTokens;log.tokens=tokens;}
   if(typeof cost==='number'&&Number.isFinite(cost)&&cost>=0){this.costUSD+=cost-reserveCost;log.costUSD=cost;}else log.costAccounting='Unknown; conservative reservation retained';
   log.generationId=typeof result.id==='string'?this.protect(result.id).slice(0,150):null;
   log.reportedModel=typeof result.model==='string'?this.protect(result.model).slice(0,160):null;
   if(this.costUSD>this.limits.maxCostUSD||this.tokens>this.limits.maxTotalTokens)throw new Error('Provider reported usage exceeding run budget; stopping');
   const choice=result.choices?.[0];if(choice?.finish_reason!=='stop'||typeof choice.message?.content!=='string')throw new Error('Incomplete structured model response');
   const parsed=JSON.parse(this.protect(choice.message.content));
   onResponse?.(structuredClone(parsed));
   log.textLengths=Object.fromEntries(['assumption','falsifier','revision'].filter(k=>typeof parsed?.[k]==='string').map(k=>[k,parsed[k].length]));
   const validated=validate(parsed);log.state='VALIDATED';return validated;
  }catch(error){log.state='FAILED';const message=/^CANCELLED$|^OpenRouter HTTP \d+$|^OpenRouter request timeout$|budget|hypothesis|mutation|structured|response too large/i.test(error.message)?this.protect(error.message):'OpenRouter request or schema validation failed';log.error=message;throw new Error(message);}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abortListener);}
 }
 summary(){return {provider:'OpenRouter',model:this.model,transport:this.kind,calls:this.calls,tokens:this.tokens,costUSD:this.costUSD,limits:this.limits,requests:structuredClone(this.logs)};}
}
