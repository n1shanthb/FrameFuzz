import test from 'node:test';import assert from 'node:assert/strict';
import {decodeFunctionData} from 'viem';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';
import {OpenRouterProvider} from '../src/swarm/provider.mjs';import {validateHypothesis} from '../src/swarm/hypothesis.mjs';import {selectHypothesis} from '../src/swarm/coordinator.mjs';
import {executeHypothesis,replayRegression} from '../src/swarm/experiment.mjs';import {independentlyReplay} from '../src/swarm/replay.mjs';import {investigate} from '../src/swarm/investigate.mjs';
import {ACTION_ABI} from '../src/mutations/frames.mjs';import {createDashboardServer} from '../src/server.mjs';
import {frameDigest} from '../src/mutations/frames.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const key='test-provider-credential-never-export';
const h=(operation=7,parameter=10)=>({suite:'frame-authorization',assumption:'Test omitted calldata commitment',change:operation===1?'parameter':parameter===10?'operation':'both',operation,parameter,unsafePrediction:'OWNER_RECOVERED',safePrediction:'OWNER_NOT_RECOVERED',falsifier:'Recovery or canonical hash invariants do not show the predicted differential',revision:'Initial hypothesis, no finding assigned'});
const response=p=>new Response(JSON.stringify({id:'mock-generation',model:'mock-model',usage:{prompt_tokens:100,completion_tokens:100,total_tokens:200,cost:0.001},choices:[{finish_reason:'stop',message:{content:JSON.stringify(p)}}]}),{status:200});
function provider(fetchImpl,limits={}){return new OpenRouterProvider({env:{OPENROUTER_API_KEY:key,OPENROUTER_MODEL:'anthropic/claude-sonnet-4.6'},fetchImpl,testTransport:true,limits});}
test('strict hypothesis schema rejects unknown tools, verdicts, out-of-range values and false change labels',()=>{
 for(const p of [{...h(),operation:-1},{...h(),parameter:1000001},{...h(),operation:0.5},{...h(),rpc:'https://bad.test'},{...h(),finding:true},{...h(),change:'both'},{...h(),operation:1,parameter:10}])assert.throws(()=>validateHypothesis(p));
});
test('coordinator deduplicates semantic values, filters v1 suites and deprioritizes known variants',()=>{
 const r=selectHypothesis([{perspective:'v',hypothesis:h(2,999)},{perspective:'s',hypothesis:h(8,10)},{perspective:'d',hypothesis:{...h(8,10),assumption:'Different text same mutation'}},{perspective:'s',hypothesis:{...h(1,21),suite:'verification-gas'}}]);assert.equal(r.selected.hypothesis.operation,8);assert.equal(r.rejected.length,2);assert(r.candidates.find(c=>c.key==='2:999').score<0);
 assert.equal(selectHypothesis([{hypothesis:h(8,10)}],{executed:[h(8,10)]}).selected,null);
 const next=selectHypothesis([{hypothesis:h(15,10)},{hypothesis:h(1,31)}],{executed:[h(8,10)]});assert.equal(next.selected.hypothesis.change,'parameter');
});
test('OpenRouter structured request and logs never emit credentials, even if echoed by a response',async()=>{
 let request;const p=provider(async(_,o)=>{request=o;return response({...h(),assumption:key});});const proposal=await p.propose([{role:'user',content:'Inspect owned fixtures'}]);
 assert.equal(request.headers.Authorization,'Bearer '+key);const body=JSON.parse(request.body);assert.equal(body.response_format.json_schema.strict,true);assert.equal(body.provider.require_parameters,true);assert(!request.body.includes(key));assert.equal(proposal.assumption,'[REDACTED]');assert(!JSON.stringify(p).includes(key));assert(!JSON.stringify(p.summary()).includes(key));
});
test('provider enforces call, token and cost reservations before sending and times out unresponsive transport',async()=>{
 let calls=0;const p=provider(async()=>{calls++;return response(h());},{maxCalls:1});await p.propose([]);await assert.rejects(p.propose([]),/budget/);assert.equal(calls,1);
 for(const limits of [{maxTotalTokens:1},{maxCostUSD:0.000001}])await assert.rejects(provider(async()=>assert.fail('must not send'),limits).propose([]),/budget/);
 await assert.rejects(provider(()=>new Promise(()=>{}),{timeoutMs:10}).propose([]),/timeout/);
 const err=provider(async()=>{throw new Error('network '+key);});await assert.rejects(err.propose([]));assert(!JSON.stringify(err.summary()).includes(key));
});

test('overlong model revision is rejected intact with content-free length diagnostics',async()=>{
 const p=provider(async()=>response({...h(),revision:'x'.repeat(601)}));
 await assert.rejects(p.propose([]),/Invalid hypothesis revision/);
 assert.equal(p.summary().requests[0].textLengths.revision,601);
 assert.equal(p.summary().requests[0].state,'FAILED');
 assert(!JSON.stringify(p.summary()).includes('x'.repeat(601)));
});
test('different model values change actual ABI calldata and deterministic observations ignore predictions',async()=>{
 const a=await executeHypothesis(h(41,10)),b=await executeHypothesis({...h(1,4321),unsafePrediction:'OWNER_NOT_RECOVERED',safePrediction:'OWNER_RECOVERED'});
 assert.deepEqual(decodeFunctionData({abi:ACTION_ABI,data:a.calldata}).args,[41n,10n]);assert.deepEqual(decodeFunctionData({abi:ACTION_ABI,data:b.calldata}).args,[1n,4321n]);assert.notEqual(a.calldata,b.calldata);
 assert.equal(a.observation.verdict,b.observation.verdict);assert.equal(b.observation.finding,false);assert.deepEqual(b.predictionSupported,{unsafe:false,safe:false});
 const replay=await independentlyReplay(a.descriptor);assert.notEqual(replay.pid,process.pid);assert.equal(replay.equivalentSemanticProperties,true);assert.equal(replay.liveVerified,false);
 const changed=structuredClone(a.descriptor);changed.compilerInputDigest='bad';await assert.rejects(replayRegression(changed),/integrity/);
 const {contentDigest,...body}=changed;const forged={...body,contentDigest:frameDigest(body)};await assert.rejects(replayRegression(forged),/provenance/);
});
test('three mocked perspective calls and an observation-conditioned revision execute two unique tests and independent replays',async()=>{
 const inputs=[];let n=0;const p=provider(async(_,request)=>{const body=JSON.parse(request.body),context=JSON.parse(body.messages[1].content);inputs.push(context);n++;
  if(n<=3)return response([h(13,10),h(1,73),h(2,999)][n-1]);
  const observed=context.untrusted.experiments[0];assert.equal(observed.actualObservation.results.safe.tamperedOwnerRecovered,false);
  const proposal=observed.hypothesis.change==='operation'?h(1,567):h(29,10);proposal.revision='Actual observation supports the offline split; isolate the other calldata field, while EVM execution remains untested';return response(proposal);
 });
 const report=await investigate({mode:'openrouter',authorizeProvider:true,provider:p});assert.equal(report.status,'COMPLETE_OFFLINE_INVESTIGATION');assert.equal(report.proposals.length,4);assert.equal(report.experiments.length,2);assert.notEqual(report.experiments[0].hypothesis.change,report.experiments[1].hypothesis.change);assert.equal(report.independentlyReproduced,true);assert.equal(report.realLLMCalls,0);assert.match(report.source,/MOCK/);assert.equal(report.finding,false);assert.equal(report.broadcasts,0);assert.equal(inputs[3].untrusted.experiments.length,1);assert(report.timeline.some(e=>e.stage==='SELECT MUTATION'));
});
test('invalid model output produces an incomplete report rather than fabricated fallback results',async()=>{
 const report=await investigate({mode:'openrouter',authorizeProvider:true,provider:provider(async()=>response({...h(),finding:true}))});assert.equal(report.status,'INCOMPLETE');assert.equal(report.experiments.length,0);assert.equal(report.finding,false);assert.match(report.source,/MOCK/);
});
test('swarm APIs preserve premium assets, require feature/consent, reject write options and keep offline mode external-free',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ff-investigator-'));let runs=0;
 const runner=async o=>{runs++;o.onEvent({stage:'OBSERVED OFFLINE'});return {schema:'framefuzz.investigation.v1',source:'MOCK_LLM — AUTOMATED TEST ONLY',executionClass:'OFFLINE_SIGNATURE_BINDING',timeline:[{stage:'OBSERVED OFFLINE'}],experiments:[],realLLMCalls:0,status:'COMPLETE_OFFLINE_INVESTIGATION'};};
 const server=createDashboardServer({resultDir:dir,swarmEnvironment:{FRAMEFUZZ_SWARM:'on',OPENROUTER_API_KEY:key},swarmRunner:runner,offlineDemo:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;
 const post=body=>fetch(url+'/api/swarm/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 try{const config=await(await fetch(url+'/api/swarm/config')).json();assert.equal(config.canCallProvider,false);assert(!JSON.stringify(config).includes(key));
 assert.equal((await post({mode:'openrouter',authorizeProvider:true})).status,409);assert.equal((await post({mode:'simulated',submit:true})).status,400);
 const started=await post({mode:'simulated'});assert.equal(started.status,202);const id=(await started.json()).id;let job;for(let i=0;i<30;i++){job=await(await fetch(url+'/api/swarm/transcript?id='+id)).json();if(job.state==='FINISHED')break;await new Promise(r=>setTimeout(r,10));}assert.equal(job.state,'FINISHED');assert.equal(runs,1);assert.equal((await fetch(url+'/api/swarm/export?id='+id+'&format=regression')).status,200);
 const recent=await(await fetch(url+'/api/swarm/recent')).json();assert.equal(recent.investigations[0].id,id);
 const asset=await(await fetch(url+'/js/app.js')).text();assert.match(asset,/Technical Briefing|renderBriefing/);assert.match(asset,/Start offline AI investigation/);assert.equal((await fetch(url+'/api/runs')).status,200);
 const bad=await fetch(url+'/api/swarm/run',{method:'POST',headers:{Origin:'https://bad.test'},body:'{}'});assert.equal(bad.status,403);
 }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});

test('swarm APIs default off even with a configured provider',async()=>{
 const server=createDashboardServer({resultDir:'runs',swarmEnvironment:{OPENROUTER_API_KEY:key}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{const config=await(await fetch(url+'/api/swarm/config')).json();assert.equal(config.enabled,false);assert.equal(config.canCallProvider,false);assert.equal((await fetch(url+'/api/swarm/recent')).status,409);assert.equal((await fetch(url+'/api/swarm/run',{method:'POST',body:JSON.stringify({mode:'openrouter',authorizeProvider:true})})).status,409);}
 finally{await new Promise(r=>server.close(r));}
});
