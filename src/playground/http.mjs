import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {readJsonObject,ApiError} from '../http-errors.mjs';
import {sha256} from '../analysis/model.mjs';
import {openRouterStatus,OpenRouterProvider} from '../swarm/provider.mjs';
import {analyzeContract,COMPILE_LIMITS} from './compile.mjs';
import {investigateContract,INVESTIGATION_LIMITS} from './investigate.mjs';
import {TOOLS,replayDescriptor} from './tools.mjs';
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,HASH=/^[\da-f]{64}$/;
const reportDigest=value=>{const text=JSON.stringify(value);if(Buffer.byteLength(text)>2*1024*1024)throw Error('REPORT_SIZE_LIMIT');return sha256(text);};
export function reportMarkdown(report){
 const safe=x=>String(x??'').replace(/[<>`]/g,'').replace(/\r?\n/g,' ');
 return ['# FrameFuzz contract investigation',`Source: ${safe(report.source)}`,`Contract: ${safe(report.contractName)}`,`Source digest: ${report.sourceDigest}`,`Analysis: ${report.analysisId}`,`Status: ${report.status}`,`Model requests: ${report.provider.calls}; accounted USD ${report.provider.costUSD}`,`Execution: local compiler/ABI/AST only; EVM/admission verified: false`,
  ...Object.values(report.agents).map(a=>`Agent ${safe(a.id)}: ${a.calls} calls, ${safe(a.state)}. ${safe(a.objective)}`),
  ...report.workspace.proposals.flatMap(e=>[`## ${safe(e.proposal.id)} — ${safe(e.state)}`,`Function: ${safe(e.proposal.functionSignature)}. Domain: ${safe(e.proposal.domain)}`,`Original: ${safe(JSON.stringify(e.proposal.originalArgs))}; mutation: ${safe(JSON.stringify(e.proposal.mutatedArgs))}`,`Feasibility: ${safe(e.feasibility?.effective)}. ${safe(e.feasibility?.deterministic.reason)}`,`Outcome: ${safe(e.outcome?.classification)}; expected ${safe(e.outcome?.expectedVerdict)}; observed ${safe(e.outcome?.observedVerdict??'NONE')}`,`Reproduction: ${safe(e.reproduction?.status??'NOT_REQUESTED')}`]),
  '## Limitations',...(report.limitations??[]).map(safe),`Content digest: ${report.contentDigest}`,''].join('\n\n');
}
export function createPlaygroundRoutes({resultDir,offlineDemo,env,getRunning,setRunning,json,providerFactory}){
 const analyses=new Map(),jobs=new Map(),directory=path.join(resultDir,'playground');
 const load=async id=>{
  if(!UUID.test(id??''))throw new ApiError(400,'INVALID_JOB','Invalid investigation ID');
  if(jobs.has(id))return jobs.get(id);
  try{const bytes=await readFile(path.join(directory,id+'.json'));if(bytes.length>2*1024*1024)throw Error();const report=JSON.parse(bytes),{contentDigest,...body}=report;if(report.schema!=='framefuzz.byoc-investigation.v1'||reportDigest(body)!==contentDigest)throw Error();return {state:report.status,report,timeline:report.timeline};}catch{throw new ApiError(404,'JOB_NOT_FOUND','Investigation not found or integrity check failed');}
 };
 return async(req,res,url)=>{
  if(!url.pathname.startsWith('/api/playground/'))return false;
  if(req.method==='GET'&&url.pathname==='/api/playground/config'){
   const provider=openRouterStatus(env);json(res,200,{compiler:'solc 0.8.28',compileLimits:COMPILE_LIMITS,investigationLimits:INVESTIGATION_LIMITS,tools:TOOLS,canStart:!offlineDemo&&env.FRAMEFUZZ_SWARM==='on'&&(provider.configured||!!providerFactory),offlineDemo,model:provider.model,transport:providerFactory?'MOCK_LLM_TRANSPORT — NO PAID MODEL':'OpenRouter',writesEnabled:false});return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/analyze'){
   const input=await readJsonObject(req,['source','abi','contractName','role'],120000);
   for(const [key,entry]of analyses)if(Date.now()-entry.at>600000)analyses.delete(key);
   if(analyses.size>=10)analyses.delete(analyses.keys().next().value);
   const c=new AbortController(),abort=()=>{if(!res.writableEnded)c.abort();};res.once('close',abort);
   try{const analysis=await analyzeContract(input,{signal:c.signal});if(analysis.status==='READY')analyses.set(analysis.analysisId,{analysis,at:Date.now()});json(res,200,analysis);}
   catch(e){throw new ApiError(e.message==='COMPILER_BUSY'?429:e.message.includes('TIMEOUT')?504:400,'COMPILER_REJECTED',e.message);}
   finally{res.removeListener('close',abort);}return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/start'){
   const input=await readJsonObject(req,['analysisId','sourceDigest','authorizeProvider']);
   if(!HASH.test(input.analysisId??'')||!HASH.test(input.sourceDigest??'')||input.authorizeProvider!==true)throw new ApiError(400,'CONSENT_OR_IDENTITY','Exact analysis/source identity and deliberate consent required');
   if(offlineDemo||env.FRAMEFUZZ_SWARM!=='on'||!providerFactory&&!env.OPENROUTER_API_KEY)throw new ApiError(409,'PROVIDER_DISABLED','Investigation requires normal mode, FRAMEFUZZ_SWARM=on, configured provider and consent; compilation remains available offline');
   const cached=analyses.get(input.analysisId);if(!cached||Date.now()-cached.at>600000||cached.analysis.sourceDigest!==input.sourceDigest)throw new ApiError(409,'STALE_ANALYSIS','Analyze the exact current source/selection again');
   if(getRunning())throw new ApiError(409,'BUSY','An experiment is already running');
   if(jobs.size>=10){const old=[...jobs].find(([,j])=>j.state!=='RUNNING');if(old)jobs.delete(old[0]);else throw new ApiError(429,'JOB_LIMIT','Investigation capacity reached');}
   const id=randomUUID(),controller=new AbortController(),job={state:'RUNNING',controller,timeline:[],report:null};jobs.set(id,job);setRunning(true);json(res,202,{id,state:job.state,sourceDigest:input.sourceDigest,transport:providerFactory?'MOCK_LLM_TRANSPORT':'OPENROUTER'});
   setImmediate(async()=>{try{
    const provider=providerFactory?providerFactory():new OpenRouterProvider({env,limits:{maxCalls:10}});
    const report=await investigateContract(cached.analysis,{id,provider,authorizeProvider:true,signal:controller.signal,onEvent:e=>job.timeline.push(e)});
    report.contentDigest=reportDigest(report);job.report=report;job.state=report.status;
    await mkdir(directory,{recursive:true});await writeFile(path.join(directory,id+'.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
   }catch{job.state=controller.signal.aborted?'CANCELLED':'INCOMPLETE';job.error='Investigation stopped; no chain transaction was sent';}finally{setRunning(false);}});return true;
  }
  if(req.method==='GET'&&url.pathname==='/api/playground/job'){
   const job=await load(url.searchParams.get('id'));json(res,200,{state:job.state,timeline:job.timeline,report:job.report,error:job.error});return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/cancel'){
   const {id}=await readJsonObject(req,['id']);if(!UUID.test(id??''))throw new ApiError(400,'INVALID_JOB','Invalid investigation ID');const job=jobs.get(id);if(!job)throw new ApiError(404,'JOB_NOT_FOUND','Active investigation not found');job.controller.abort();json(res,200,{id,state:job.state==='RUNNING'?'CANCELLING':job.state});return true;
  }
  if(req.method==='GET'&&url.pathname==='/api/playground/export'){
   const job=await load(url.searchParams.get('id'));if(!job.report)throw new ApiError(409,'NO_REPORT','Investigation has no completed report yet');const format=url.searchParams.get('format')??'json';
   if(!['json','markdown'].includes(format))throw new ApiError(400,'FORMAT','Use JSON or Markdown');
   const body=format==='json'?JSON.stringify(job.report,null,2):reportMarkdown(job.report);res.writeHead(200,{'content-type':format==='json'?'application/json; charset=utf-8':'text/markdown; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-disposition':`attachment; filename="framefuzz-contract.${format==='json'?'json':'md'}"`});res.end(body);return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/replay'){
   const {id,entryId}=await readJsonObject(req,['id','entryId']);if(typeof entryId!=='string'||entryId.length>200)throw new ApiError(400,'ENTRY','Invalid proposal selection');const job=await load(id),report=job.report;
   const entry=report?.workspace.proposals.find(e=>e.entryId===entryId&&e.state==='EXECUTED');if(!entry)throw new ApiError(409,'NO_DESCRIPTOR','Choose an executed local descriptor');
   const result=await replayDescriptor(entry.execution.descriptor,report.reproductionInput);json(res,200,{result,mode:'LOCAL_STATIC_REPLAY',broadcasts:0,paidCalls:0});return true;
  }
  json(res,404,{error:'Unknown Playground route'});return true;
 };
}
