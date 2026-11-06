import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {readJsonObject,ApiError} from '../http-errors.mjs';
import {sha256,digest} from '../analysis/model.mjs';
import {openRouterStatus,OpenRouterProvider} from '../swarm/provider.mjs';
import {analyzeContract,COMPILE_LIMITS} from './compile.mjs';
import {investigateContract,INVESTIGATION_LIMITS} from './investigate.mjs';
import {TOOLS,replayDescriptor} from './tools.mjs';
import {PROFILES,loadUniswapProfileAnalysis} from './profiles.mjs';
import {budgetStatus,attachSprintBudget,planInvestigationBudget,SPRINT_BUDGET_USD,MIN_INVESTIGATION_USD} from './budget.mjs';
import {discoverCommunityRegressions,buildPublishConfirmation,ENTITY} from './arkiv-intelligence.mjs';
import {arkivClients,ARKIV_CHAIN_ID} from '../arkiv/client.mjs';
import {createRegistry} from '../arkiv/registry.mjs';
import {saveReport} from '../reports.mjs';
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,HASH=/^[\da-f]{64}$/;
const reportDigest=value=>{const text=JSON.stringify(value);if(Buffer.byteLength(text)>2*1024*1024)throw Error('REPORT_SIZE_LIMIT');return sha256(text);};
const operatorConfigured=env=>/^0x[\da-fA-F]{64}$/.test(env?.ARKIV_PRIVATE_KEY||'');
/** Playground live agents: LIVE_READ_ONLY/AUTHORIZED with OpenRouter, or legacy FRAMEFUZZ_SWARM=on. */
export function playgroundInvestigationReadiness({offlineDemo,env,providerFactory,capabilityMode,provider}={}){
  const blockers=[];
  if(offlineDemo)blockers.push('SAVED_DEMO_OR_OFFLINE disables paid investigations');
  const mode=capabilityMode??'LIVE_READ_ONLY';
  const swarmOn=env?.FRAMEFUZZ_SWARM==='on';
  const liveMode=mode==='LIVE_READ_ONLY'||mode==='LIVE_AUTHORIZED';
  if(!liveMode&&!swarmOn)blockers.push('Start with --mode LIVE_READ_ONLY (recommended) or set FRAMEFUZZ_SWARM=on for Swarm Lab offline crypto');
  const keyOk=Boolean(providerFactory)||Boolean(provider?.configured)||Boolean(env?.OPENROUTER_API_KEY?.trim());
  if(!keyOk)blockers.push('OPENROUTER_API_KEY is not configured in the server environment');
  return {
    canStart:blockers.length===0,
    blockers,
    mode,
    openRouterConfigured:Boolean(provider?.configured)||Boolean(env?.OPENROUTER_API_KEY?.trim()),
    openRouterKeyPresent:Boolean(env?.OPENROUTER_API_KEY?.trim()),
    swarmEnvEnabled:swarmOn,
    liveModeEnablesAgents:liveMode,
    notice:blockers.length===0
      ?'Ready for consented OpenRouter investigation. No chain broadcast from Playground start.'
      :blockers.join(' · '),
  };
}
export function reportMarkdown(report){
 const safe=x=>String(x??'').replace(/[<>`]/g,'').replace(/\r?\n/g,' ');
 const arkiv=report.arkivIntelligence;
 return ['# FrameFuzz contract investigation',`Source: ${safe(report.source)}`,`Profile: ${safe(report.profileId??'byoc')}`,`Contract: ${safe(report.contractName)}`,`Source digest: ${report.sourceDigest}`,`Analysis: ${report.analysisId}`,`Status: ${report.status}`,`Model requests: ${report.provider.calls}; accounted USD ${report.provider.costUSD}`,`Execution: local compiler/ABI/AST or historical evidence; EVM/admission verified: ${report.admissionVerified===true}`,
  `Arkiv discovery: ${safe(arkiv?.discovery?.status??'n/a')} · ${arkiv?.consulted?.length??0} consulted · influences ${arkiv?.influences?.length??0}`,
  ...Object.values(report.agents).map(a=>`Agent ${safe(a.id)}: ${a.calls} calls, ${safe(a.state)}. ${safe(a.objective)}`),
  ...report.workspace.proposals.flatMap(e=>[`## ${safe(e.proposal.id)} — ${safe(e.state)}`,`Function/tool: ${safe(e.proposal.functionSignature)} / ${safe(e.proposal.tool)}. Domain: ${safe(e.proposal.domain)}`,`Original: ${safe(JSON.stringify(e.proposal.originalArgs))}; mutation: ${safe(JSON.stringify(e.proposal.mutatedArgs))}`,`Feasibility: ${safe(e.feasibility?.effective)}. ${safe(e.feasibility?.deterministic.reason)}`,`Outcome: ${safe(e.outcome?.classification)}; domain ${safe(e.outcome?.outcomeDomain)}; expected ${safe(e.outcome?.expectedVerdict)}; observed ${safe(e.outcome?.observedVerdict??'NONE')}`,`Reproduction: ${safe(e.reproduction?.status??'NOT_REQUESTED')}`]),
  '## Limitations',...(report.limitations??[]).map(safe),`Content digest: ${report.contentDigest}`,''].join('\n\n');
}
export function createPlaygroundRoutes({resultDir,offlineDemo,env,getRunning,setRunning,json,providerFactory,capabilityMode,arkivRegistryFactory,arkivSavedLookup,arkivPublishSubmit=null}){
 const analyses=new Map(),jobs=new Map(),directory=path.join(resultDir,'playground');
 const pendingPublish=new Map();
 const load=async id=>{
  if(!UUID.test(id??''))throw new ApiError(400,'INVALID_JOB','Invalid investigation ID');
  if(jobs.has(id))return jobs.get(id);
  try{const bytes=await readFile(path.join(directory,id+'.json'));if(bytes.length>2*1024*1024)throw Error();const report=JSON.parse(bytes),{contentDigest,...body}=report;if(report.schema!=='framefuzz.byoc-investigation.v1'||reportDigest(body)!==contentDigest)throw Error();return {state:report.status,report,timeline:report.timeline};}catch{throw new ApiError(404,'JOB_NOT_FOUND','Investigation not found or integrity check failed');}
 };
 const softDiscover=async analysis=>{
  try{
   if(offlineDemo){
    return await discoverCommunityRegressions(analysis,{
     registryFactory:()=>{throw new Error('OFFLINE_DEMO_NO_LIVE_ARKIV');},
     savedLookup:arkivSavedLookup,
     timeoutMs:500,
    });
   }
   return await discoverCommunityRegressions(analysis,{
    registryFactory:arkivRegistryFactory??(()=>createRegistry({...arkivClients({readOnly:true})})),
    savedLookup:arkivSavedLookup,
    timeoutMs:4500,
   });
  }catch{return {schema:'framefuzz.arkiv-discovery.v1',status:'UNAVAILABLE',cases:[],agentSummaries:[],notice:'Community regression lookup unavailable.',broadcasts:0};}
 };
 return async(req,res,url)=>{
  if(!url.pathname.startsWith('/api/playground/'))return false;
  if(req.method==='GET'&&url.pathname==='/api/playground/config'){
   const provider=openRouterStatus(env),budget=await budgetStatus(resultDir);
   const readiness=playgroundInvestigationReadiness({offlineDemo,env,providerFactory,capabilityMode,provider});
   const byocPlan=planInvestigationBudget({profileId:'byoc',remainingUSD:budget.remainingUSD});
   const uniPlan=planInvestigationBudget({profileId:'uniswap-v4-paymaster',remainingUSD:budget.remainingUSD});
   json(res,200,{compiler:'solc 0.8.28',compileLimits:COMPILE_LIMITS,investigationLimits:INVESTIGATION_LIMITS,tools:TOOLS,profiles:PROFILES,sprintBudget:{capUSD:SPRINT_BUDGET_USD,spentUSD:budget.spentUSD,remainingUSD:budget.remainingUSD,sprintId:budget.sprintId,reservedUSD:budget.reservedUSD},investigationBudget:{byoc:byocPlan,uniswap:uniPlan,minInvestigationUSD:MIN_INVESTIGATION_USD,layers:{providerAccount:'OpenRouter key limit is separate and is not FrameFuzz authorization',sprintAggregate:`FrameFuzz sprint ${budget.sprintId} cap $${SPRINT_BUDGET_USD}`,perRun:'Allocated at Start from remaining sprint budget'}},canStart:readiness.canStart&&byocPlan.blockers.length===0,investigationReadiness:{...readiness,canStart:readiness.canStart&&byocPlan.blockers.length===0,blockers:[...readiness.blockers,...byocPlan.blockers],notice:byocPlan.blockers[0]??readiness.notice},offlineDemo,model:provider.model,transport:providerFactory?'MOCK_LLM_TRANSPORT — NO PAID MODEL':'OpenRouter',writesEnabled:false,arkivWritesEnabled:false,arkivOperatorConfigured:operatorConfigured(env)&&!offlineDemo,chainBroadcastEnabled:false,arkivChainId:ARKIV_CHAIN_ID,capabilityMode:capabilityMode??null});return true;
  }
  if(req.method==='GET'&&url.pathname==='/api/playground/budget'){json(res,200,await budgetStatus(resultDir));return true;}
  if(req.method==='POST'&&url.pathname==='/api/playground/analyze'){
   const input=await readJsonObject(req,['source','abi','contractName','role','profile'],120000);
   for(const [key,entry]of analyses)if(Date.now()-entry.at>600000)analyses.delete(key);
   if(analyses.size>=10)analyses.delete(analyses.keys().next().value);
   const c=new AbortController(),abort=()=>{if(!res.writableEnded)c.abort();};res.once('close',abort);
   try{
    let analysis;
    if(input.profile==='uniswap-v4-paymaster')analysis=await loadUniswapProfileAnalysis();
    else if(input.profile==='regression-registry'){const sourceDigest=digest({profile:'regression-registry'});analysis={status:'READY',analysisId:digest({profile:'regression-registry',v:1}),sourceDigest,source:'',contractName:'RegressionRegistry',compiler:null,functions:[],sourceFacts:[{id:'registry',kind:'meta',file:'src/arkiv/registry.mjs',startLine:1,endLine:1,sourceDigest,claim:'Arkiv Rabdi publish/query/import uses explicit submit and funded writer'}],capabilities:['ARKIV_MANIFEST','UNSIGNED_IMPORT','COMMUNITY_DISCOVERY'],missingPrerequisites:['EXPLICIT_PUBLISH_CONFIRMATION','FUNDED_ARKIV_WRITER'],diagnostics:[],structure:{functions:[],variables:[],events:[],guards:[],externalCalls:[]},declaredRole:'UNKNOWN',detectedRole:{role:'UNKNOWN',basis:'Registry workflow'},contracts:[],limitations:['No automatic Arkiv write'],profile:{id:'regression-registry',title:'Regression Registry',summary:PROFILES[2].summary}};}
    else{const {profile,...intake}=input;analysis=await analyzeContract(intake,{signal:c.signal});}
    if(analysis.status==='READY'){
     analysis.arkivDiscovery=await softDiscover(analysis);
     analyses.set(analysis.analysisId,{analysis,at:Date.now()});
    }
    json(res,200,analysis);
   }catch(e){throw new ApiError(e.message==='COMPILER_BUSY'?429:e.message.includes('TIMEOUT')?504:400,'COMPILER_REJECTED',e.message);}
   finally{res.removeListener('close',abort);}return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/start'){
   const input=await readJsonObject(req,['analysisId','sourceDigest','authorizeProvider','budgetUSD']);
   if(!HASH.test(input.analysisId??'')||!HASH.test(input.sourceDigest??'')||input.authorizeProvider!==true)throw new ApiError(400,'CONSENT_OR_IDENTITY','Exact analysis/source identity and deliberate consent required');
   const readiness=playgroundInvestigationReadiness({offlineDemo,env,providerFactory,capabilityMode,provider:openRouterStatus(env)});
   if(!readiness.canStart)throw new ApiError(409,'PROVIDER_DISABLED',readiness.notice);
   const cached=analyses.get(input.analysisId);if(!cached||Date.now()-cached.at>600000||cached.analysis.sourceDigest!==input.sourceDigest)throw new ApiError(409,'STALE_ANALYSIS','Analyze the exact current source/selection again');
   if(getRunning())throw new ApiError(409,'BUSY','An experiment is already running');
   if(jobs.size>=10){const old=[...jobs].find(([,j])=>j.state!=='RUNNING');if(old)jobs.delete(old[0]);else throw new ApiError(429,'JOB_LIMIT','Investigation capacity reached');}
   const profileId=cached.analysis.profile?.id??'byoc';
   const sprint=await budgetStatus(resultDir);
   const plan=planInvestigationBudget({profileId,requestedUSD:input.budgetUSD,remainingUSD:sprint.remainingUSD,allowBelowMinimum:Boolean(providerFactory)});
   if(!providerFactory&&plan.blockers.length)throw new ApiError(409,'SPRINT_BUDGET_TOO_LOW',plan.blockers[0]);
   if(!providerFactory&&!plan.canComplete)throw new ApiError(409,'INVESTIGATION_BUDGET_INSUFFICIENT',`Allocated $${plan.allocatedUSD.toFixed(4)} is below estimated finish $${plan.estimatedFinishUSD}; sprint remaining $${sprint.remainingUSD.toFixed(4)}`);
   const maxUSD=Math.max(plan.allocatedUSD,providerFactory?0.01:plan.allocatedUSD);
   const id=randomUUID(),controller=new AbortController(),job={state:'RUNNING',controller,timeline:[],report:null,budget:{sprintRemainingBefore:sprint.remainingUSD,...plan}};jobs.set(id,job);setRunning(true);json(res,202,{id,state:job.state,sourceDigest:input.sourceDigest,transport:providerFactory?'MOCK_LLM_TRANSPORT':'OPENROUTER',budgetUSD:maxUSD,estimatedFinishUSD:plan.estimatedFinishUSD,sprintRemainingUSD:sprint.remainingUSD,profileId});
   setImmediate(async()=>{let provider;try{
    provider=providerFactory?providerFactory():attachSprintBudget(new OpenRouterProvider({env,limits:{maxCalls:10,maxCostUSD:maxUSD,maxTotalTokens:90000,maxOutputTokens:1600,maxInputBytes:48000}}),resultDir,profileId+':'+id,{maxUSD});
    const report=await investigateContract(cached.analysis,{
     id,provider,authorizeProvider:true,signal:controller.signal,onEvent:e=>job.timeline.push(e),
     arkivDiscovery:cached.analysis.arkivDiscovery,
     arkivRegistryFactory,arkivSavedLookup,
    });
    report.profileId=profileId;report.budget=job.budget;report.contentDigest=reportDigest(report);job.report=report;job.state=report.status;
    await provider.settleSprint?.({failed:report.status!=='COMPLETE'});
    await mkdir(directory,{recursive:true});await writeFile(path.join(directory,id+'.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
   }catch(e){job.state=controller.signal.aborted?'CANCELLED':'INCOMPLETE';job.error=provider?.protect?.(e.message)??'Investigation stopped; no chain transaction was sent';try{await provider?.settleSprint?.({failed:true});}catch{}}finally{setRunning(false);}});return true;
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
   if(report.profileId==='uniswap-v4-paymaster'||entry.proposal.tool==='historical_evidence'){json(res,200,{result:entry.execution,mode:'HISTORICAL_OR_PROFILE_REPLAY_REFUSED',notice:'Historical/profile descriptors are not re-executed as fresh admissions',broadcasts:0,paidCalls:0});return true;}
   const result=await replayDescriptor(entry.execution.descriptor,report.reproductionInput);json(res,200,{result,mode:'LOCAL_STATIC_REPLAY',broadcasts:0,paidCalls:0});return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/arkiv/import'){
   if(offlineDemo)return json(res,503,{error:'Live Arkiv import disabled in offline mode',broadcasts:0});
   const body=await readJsonObject(req,['entityKey','analysisId'],2048);
   if(!ENTITY.test(body.entityKey??''))throw new ApiError(400,'INVALID_ENTITY_KEY','Entity key must be 32-byte hex');
   if(body.submit||body.broadcast)throw new ApiError(400,'WRITE_FORBIDDEN','Import never broadcasts');
   const registry=arkivRegistryFactory?arkivRegistryFactory():createRegistry({...arkivClients({readOnly:true})});
   const {retrieved,preview}=await registry.importPreview(body.entityKey);
   if(preview.submissions!==0)throw new ApiError(500,'IMPORT_INVARIANT','Import attempted submission');
   const saved=await saveReport(preview,resultDir);
   json(res,200,{
    mode:'UNSIGNED_COMMUNITY_IMPORT',
    broadcasts:0,
    entityKey:retrieved.key,
    owner:retrieved.owner,
    creator:retrieved.creator,
    expiresAtBlock:retrieved.expiresAtBlock,
    contentDigest:retrieved.record.contentDigest,
    verification:retrieved.verification,
    labels:{historical:'IMPORTED_HISTORICAL_CASE',prediction:'FRESH_GENERATED_UNSIGNED_PREVIEW',observation:'NOT_EXECUTED_ON_CHAIN'},
    previewSource:preview.source,
    submissions:preview.submissions,
    file:path.basename(saved.jsonFile),
    communityOrigin:preview.communityOrigin,
    notice:'Imported historical case generated a new unsigned preview. No transaction was broadcast.',
   });
   return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/arkiv/publish-preview'){
   if(offlineDemo||!operatorConfigured(env))return json(res,403,{canPublish:false,operatorRequired:true,notice:'Public judges may query/import but cannot spend the server writer wallet'});
   const body=await readJsonObject(req,['contentDigest','sourceReport','suite','ruleId','expiresAtBlock','expirationBlocks','caseIndex','maxFeeEther','live'],8192);
   if(!HASH.test(body.contentDigest??''))throw new ApiError(400,'DIGEST','contentDigest required');
   const confirmation=buildPublishConfirmation({...body,env,live:body.live??{gasPriceWei:'1000000000',nonce:0,balanceWei:'10000000000000000000',currentBlock:'1'}});
   if(confirmation.canPublish)pendingPublish.set(confirmation.confirmToken,{at:Date.now(),confirmation,body});
   json(res,200,{...confirmation,broadcasts:0});return true;
  }
  if(req.method==='POST'&&url.pathname==='/api/playground/arkiv/publish-confirm'){
   if(offlineDemo||!operatorConfigured(env))return json(res,403,{error:'Operator wallet not available to public clients',broadcasts:0});
   const body=await readJsonObject(req,['intentDigest','confirm','maxFeeEther'],2048);
   if(body.confirm!==true)throw new ApiError(400,'CONFIRMATION_REQUIRED','Explicit confirm:true required');
   const pending=pendingPublish.get(body.intentDigest);
   if(!pending||Date.now()-pending.at>600000)throw new ApiError(409,'STALE_OR_UNKNOWN_INTENT','Publish preview expired or intent changed — request a fresh confirmation');
   if(pending.confirmation.intent.intentDigest!==body.intentDigest)throw new ApiError(409,'INTENT_MISMATCH','Intent digest changed — fresh confirmation required');
   if(body.maxFeeEther&&body.maxFeeEther!==pending.confirmation.envelope.maxFeeEther)throw new ApiError(409,'FEE_CEILING_CHANGED','Fee ceiling changes require a new preview');
   pendingPublish.delete(body.intentDigest);
   if(typeof arkivPublishSubmit!=='function'){
    json(res,200,{status:'CONFIRMATION_ACCEPTED_SUBMIT_NOT_WIRED',intentDigest:body.intentDigest,broadcasts:0,notice:'Confirmation accepted; live submit hook not attached in this process (no automatic broadcast).'});
    return true;
   }
   try{
    const result=await arkivPublishSubmit(pending);
    json(res,200,{status:'PUBLISHED',broadcasts:1,...result,notice:'Single publication; do not auto-retry on uncertainty'});
   }catch(error){
    json(res,409,{status:'BROADCAST_FAILED_RECONCILE_DO_NOT_RETRY',error:String(error.message).slice(0,240),broadcasts:0,autoRetry:false});
   }
   return true;
  }
  json(res,404,{error:'Unknown Playground route'});return true;
 };
}
