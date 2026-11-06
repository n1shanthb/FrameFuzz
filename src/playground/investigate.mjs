import {randomUUID} from 'node:crypto';
import {sha256,boundedJSON} from '../analysis/model.mjs';
import {OpenRouterProvider} from '../swarm/provider.mjs';
import {classifyOutcome} from '../swarm/outcome.mjs';
import {AgentSession} from './session.mjs';
import {SCOUT,MUTATION,VALIDATOR,CRITIC,PROPOSAL,validate} from './schemas.mjs';
import {TOOLS,checkProposal,executeProposal,typedDescriptor,proposalKey,readTool} from './tools.mjs';
export const INVESTIGATION_LIMITS={maxCalls:10,maxCostUSD:0.5,maxTotalTokens:60000,maxRevisionRounds:1,maxProposals:4,maxReplays:1,timeoutMs:180000};
export function agentFacts(analysis){
 const facts={analysisId:analysis.analysisId,sourceDigest:analysis.sourceDigest,contractName:analysis.contractName,compiler:analysis.compiler,declaredRole:analysis.declaredRole,detectedRole:analysis.detectedRole,
  functions:analysis.functions,sourceFacts:analysis.sourceFacts.slice(0,24),capabilities:analysis.capabilities,missingPrerequisites:analysis.missingPrerequisites,tools:TOOLS,
  boundaries:'Encodable ABI_ENCODING values prove encoder acceptance only. Impossible ABI widths/types are SKIPPED_INVALID unless domain=ABI_TOOL_TEST with negativeObjective=ABI_REJECTION (encoder conformance, never contract/mempool failure). require/revert needs an EVM executor (unsupported here). Unknown roles never imply admission. Uniswap profile may cite historical public/alt evidence and StateView.getSlot0 context without claiming fresh execution.'};
 if(Buffer.byteLength(JSON.stringify(facts))>14000)throw Error('AGENT_FACT_CONTEXT_LIMIT: reduce source/function complexity');return facts;
}
export async function investigateContract(analysis,options={}){
 if(options.authorizeProvider!==true)throw Error('Explicit paid-model consent required');
 if(options.submit||options.deploy||options.publish||options.fund)throw Error('BLOCKED_WRITE');
 if(analysis.status!=='READY'||sha256(analysis.source)!==analysis.sourceDigest)throw Error('STALE_ANALYSIS');
 const facts=agentFacts(analysis),provider=options.provider??new OpenRouterProvider({limits:{maxCalls:10}}),id=options.id??randomUUID();
 const report={schema:'framefuzz.byoc-investigation.v1',id,analysisId:analysis.analysisId,sourceDigest:analysis.sourceDigest,contractName:analysis.contractName,profileId:analysis.profile?.id??'byoc',generatedAt:new Date().toISOString(),source:provider.kind==='OPENROUTER'?'OPENROUTER_STATEFUL_AGENTS':'MOCK_LLM_TRANSPORT — NO PAID MODEL',status:'RUNNING',limits:INVESTIGATION_LIMITS,
  contract:analysis,agents:{},workspace:{identity:{analysisId:analysis.analysisId,sourceDigest:analysis.sourceDigest},facts,messages:[],proposals:[],objections:[],toolOutputs:[],followUps:[],dispositions:[],evidenceReferences:analysis.sourceFacts.map(f=>({id:f.id,file:f.file,startLine:f.startLine,endLine:f.endLine,sourceDigest:f.sourceDigest}))},timeline:[],broadcasts:0,evmExecuted:false,admissionVerified:false,verifiedVulnerability:false};
 const controller=new AbortController(),cancel=()=>controller.abort(),timeoutMs=options.timeoutMs??INVESTIGATION_LIMITS.timeoutMs;
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>INVESTIGATION_LIMITS.timeoutMs)throw Error('Invalid investigation deadline');
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);options.signal?.addEventListener('abort',cancel,{once:true});if(options.signal?.aborted)cancel();
 const emit=event=>{const e={...event,at:new Date().toISOString(),sequence:report.timeline.length};report.timeline.push(e);options.onEvent?.(structuredClone(e));};
 const agents=Object.fromEntries(['scout','mutation','validator','critic'].map(role=>[role,new AgentSession(role,id,provider,emit,{profileId:analysis.profile?.id??null})]));
 const send=(from,to,type,payload)=>{const target=agents[to];const msg=target?target.receive(from,type,payload):{from,to,type,payload:structuredClone(payload)};report.workspace.messages.push({...msg,id:'message-'+report.workspace.messages.length});emit({stage:'AGENT_MESSAGE',from,to:target?.id??to,type,payload});};
 const tool=async(actor,name,input,operation)=>{
  if(controller.signal.aborted)throw Error('CANCELLED');emit({stage:'TOOL_REQUEST',actor,tool:name,input});
  try{const output=await operation();boundedJSON(output,1048576);const entry={id:'tool-'+report.workspace.toolOutputs.length,actor,tool:name,input,output};report.workspace.toolOutputs.push(entry);emit({stage:'TOOL_RESPONSE',...entry});return output;}
  catch(e){emit({stage:'TOOL_FAILURE',actor,tool:name,error:e.message});throw e;}
 };
 const ask=async(role,task,schema)=>{
  let response=await agents[role].ask(task,schema,{signal:controller.signal});
  if(response.toolRequests.length){
   for(const request of response.toolRequests){
    if(!agents[role].permissions.includes(request.tool))throw Error('AGENT_TOOL_PERMISSION_DENIED');
    const output=await tool(agents[role].id,request.tool,request,()=>{
     if(request.tool==='feasibility'){
      const candidate=response.proposals?.find(p=>p.id===request.proposalId)??report.workspace.proposals.find(p=>p.proposal.id===request.proposalId)?.proposal;if(!candidate)throw Error('UNKNOWN_PROPOSAL');validate(candidate,PROPOSAL);return {schema:'framefuzz.feasibility-feedback.v1',proposalId:candidate.id,...checkProposal(candidate,analysis)};
     }
     return readTool(request.tool,request.tool==='inspect_source'?{startLine:request.startLine,endLine:request.endLine}:request.tool==='query_abi'?{functionSignature:request.functionSignature}:{},analysis);
    });send('tool:'+request.tool,role,'TOOL_RESULT',output);
   }
   response=await agents[role].ask('Revise/finalize your own decision using the actual tool results in your private history. No more read-tool rounds: toolRequests must be empty.',schema,{signal:controller.signal});
   if(response.toolRequests.length)throw Error('AGENT_TOOL_ROUND_LIMIT');
  }return response;
 };
 const seen=new Set();let revisionRounds=0;
 const validateBatch=async(entries)=>{
  const proposals=entries.map(e=>e.proposal);send(agents.mutation.id,'validator','PROPOSALS',{proposals});
  const decision=await ask('validator','Independently validate every supplied proposal with concrete source/ABI objections and requested repair. One exact proposalId decision per proposal. Expected ABI rejection is meaningful; do not filter it merely for failing.',VALIDATOR);
  if(decision.decisions.length!==entries.length||new Set(decision.decisions.map(d=>d.proposalId)).size!==entries.length||decision.decisions.some(d=>!proposals.some(p=>p.id===d.proposalId)))throw Error('VALIDATOR_COVERAGE_MISMATCH');
  for(const entry of entries){
   const p=entry.proposal,model=decision.decisions.find(d=>d.proposalId===p.id),deterministic=await tool('coordinator','feasibility',p,()=>({schema:'framefuzz.deterministic-feasibility.v1',...checkProposal(p,analysis,{seen})}));
   const referencesValid=model.factIds.every(id=>analysis.sourceFacts.some(f=>f.id===id));
   const effective=!referencesValid?'INVALID':deterministic.decision!=='EXECUTABLE'?deterministic.decision:model.decision;
   entry.feasibility={model,deterministic,effective,disagreement:!referencesValid||model.decision!==deterministic.decision};entry.state=effective==='EXECUTABLE'?'READY':effective==='INVALID'?'REJECTED':'DEFERRED';
   if(effective==='EXECUTABLE')seen.add(proposalKey(p));
   else{
    entry.outcome={...classifyOutcome({expectedVerdict:p.expectedVerdict,executionMode:p.tool==='abi_encode'?'OFFLINE_ABI_ENCODING':'STATIC_AST',feasibilityDecision:effective,provenance:'SOURCE_BOUND_PRE_EXECUTION_GATES'}),outcomeDomain:p.domain};
    const objection={entryId:entry.entryId,proposal:p,model,deterministic,effective};report.workspace.objections.push(objection);send(agents.validator.id,'mutation','OBJECTION_AND_REPAIR_REQUIREMENTS',objection);
   }
  }return entries;
 };
 const addBatch=(response,parent=null)=>{
  if(report.workspace.proposals.length+response.proposals.length>INVESTIGATION_LIMITS.maxProposals)throw Error('PROPOSAL_BUDGET');
  if(new Set(response.proposals.map(p=>p.id)).size!==response.proposals.length)throw Error('DUPLICATE_PROPOSAL_IDS');
  const entries=response.proposals.map(proposal=>({entryId:'proposal-'+report.workspace.proposals.length+'-'+proposal.id,proposal,revision:parent?1:0,parentEntryId:parent?.entryId??null,state:'PROPOSED'}));report.workspace.proposals.push(...entries);return entries;
 };
 const execute=async(entries)=>{
  for(const entry of entries){if(entry.state!=='READY')continue;
   const fresh=checkProposal(entry.proposal,analysis);if(fresh.decision!=='EXECUTABLE')throw Error('EXECUTION_RECHECK_VETO');
   send(agents.mutation.id,'executor','VALIDATED_TEST_PROPOSAL',{entryId:entry.entryId,proposal:entry.proposal});
   await tool('executor','typed_descriptor',entry.proposal,()=>typedDescriptor(entry.proposal,analysis));
   entry.execution=await tool('executor',entry.proposal.tool,entry.proposal,()=>executeProposal(entry.proposal,analysis));entry.state='EXECUTED';entry.outcome=entry.execution.outcome;
   send('executor','critic','ACTUAL_OBSERVATION',{entryId:entry.entryId,proposal:entry.proposal,execution:entry.execution});
   send('executor','mutation','ACTUAL_OBSERVATION',{entryId:entry.entryId,proposal:entry.proposal,execution:entry.execution});
  }
 };
 try{
  for(const role of Object.keys(agents))send('workspace',role,'VERIFIED_COMPILER_FACTS',facts);
  report.workspace.toolOutputs.push({id:'compiler-intake',actor:'developer',tool:'compiler_abi',input:{sourceDigest:analysis.sourceDigest},output:{status:analysis.status,analysisId:analysis.analysisId,compiler:analysis.compiler,functions:analysis.functions,diagnostics:analysis.diagnostics}});
  const scout=await ask('scout',analysis.profile?.id==='uniswap-v4-paymaster'?'Inspect the Uniswap v4 paymaster profile: StateView.getSlot0 dependency, stake vs unstaked external storage reads, and historical public/alternative evidence. Cite fact IDs. Do not invent fresh admissions.':'Inspect this exact submitted contract and send cited opportunities/questions to Mutation. No fixture matching. You can request source ranges or ABI facts if necessary.',SCOUT);
  if(scout.findings.some(f=>f.factIds.some(id=>!analysis.sourceFacts.some(a=>a.id===id))))throw Error('SCOUT_REFERENCE_MISMATCH');
  send(agents.scout.id,'mutation','SOURCE_BACKED_OPPORTUNITIES',{findings:scout.findings,opportunities:scout.opportunities,questions:scout.questions});
  const mutation=await ask('mutation','Generate one or two distinct proposals tied to this analysisId and sourceDigest. Prefer encodable ABI_ENCODING mutations of real compiled functions (PASS when expected ACCEPT). Use domain ABI_TOOL_TEST with negativeObjective ABI_REJECTION only for deliberate encoder conformance. Do not claim require/revert or admission without the matching tool. Out-of-range ints in ABI_ENCODING are invalid.',MUTATION);
  let entries=await validateBatch(addBatch(mutation));
  const rejected=entries.find(e=>['INVALID','CONDITIONAL','UNSUPPORTED'].includes(e.feasibility.effective));
  if(rejected){
   revisionRounds++;const repair=await ask('mutation','Repair exactly one rejected proposal using the Validator and deterministic objections in your OWN retained history. Return exactly one proposal; preserve its id and source binding. A genuinely unsupported test may stay deferred. Do not invent execution evidence.',MUTATION);
   if(repair.proposals.length!==1||repair.proposals[0].id!==rejected.proposal.id)throw Error('REPAIR_IDENTITY_OR_COUNT');
   entries=entries.filter(e=>e!==rejected).concat(await validateBatch(addBatch(repair,rejected)));
  }
  await execute(entries);
  send('workspace','critic','ALL_VALIDATION_DISPOSITIONS',report.workspace.proposals.map(e=>({entryId:e.entryId,proposal:e.proposal,feasibility:e.feasibility,state:e.state,outcome:e.outcome})));
  const critique=await ask('critic','Review actual observations and hypotheses in your own history. Return uncertainty and unresolved questions. You may request one executed proposal ID replay and one bounded follow-up from Mutation. No behavioral/mempool verdicts from ABI or AST output.',CRITIC);report.critic=critique;
  send(agents.critic.id,'scout','UNRESOLVED_QUESTIONS',{questions:critique.unresolved});
  for(const proposalId of critique.replayIds){const entry=report.workspace.proposals.find(e=>e.proposal.id===proposalId&&e.state==='EXECUTED');
   if(!entry){emit({stage:'REPLAY_REFUSED',proposalId,reason:'No executed local descriptor'});continue;}
   const replay=await tool(agents.critic.id,'replay',{entryId:entry.entryId},()=>executeProposal(entry.proposal,analysis));
   entry.reproduction={status:JSON.stringify(replay.actual)===JSON.stringify(entry.execution.actual)?'LOCAL_TOOL_MATCH':'MISMATCH',descriptorDigest:entry.execution.descriptor.digest,independence:'Same local implementation; no independent EVM/client proof'};
   send('executor','critic','REPLAY_OBSERVATION',{proposalId,replay,reproduction:entry.reproduction});
  }
  if(critique.followUp.requested){
   const request=critique.followUp;report.workspace.followUps.push(request);send(agents.critic.id,'mutation','FOLLOW_UP_REQUEST',request);
   if(revisionRounds>=INVESTIGATION_LIMITS.maxRevisionRounds)emit({stage:'FOLLOW_UP_DEFERRED',reason:'The single shared revision round was used for repair'});
   else{
    revisionRounds++;const follow=await ask('mutation','Act on Critic feedback in your retained history: propose exactly one new bounded test, with a new id. It will receive fresh Validator review and deterministic gates.',MUTATION);
    if(follow.proposals.length!==1||report.workspace.proposals.some(e=>e.proposal.id===follow.proposals[0].id))throw Error('FOLLOW_UP_IDENTITY_OR_COUNT');
    await execute(await validateBatch(addBatch(follow)));
   }
  }
  report.status='COMPLETE';
 }catch(e){report.status=timedOut?'TIMED_OUT':controller.signal.aborted?'CANCELLED':'INCOMPLETE';report.error=provider.protect(e.message);emit({stage:report.status,error:report.error});}
 finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
 for(const [role,agent]of Object.entries(agents)){if(agent.state!=='FAILED'&&agent.state!=='CANCELLED')agent.state=report.status==='COMPLETE'?'COMPLETE':report.status;report.agents[role]=agent.snapshot();}
 report.provider=provider.summary();report.realModelCalls=provider.kind==='OPENROUTER'?report.provider.requests.filter(r=>r.state==='VALIDATED').length:0;
 report.workspace.dispositions=report.workspace.proposals.map(e=>({entryId:e.entryId,state:e.state,outcome:e.outcome??null,reproduction:e.reproduction??null}));
 report.reproductionInput={source:analysis.source,contractName:analysis.contractName,role:analysis.declaredRole};report.limitations=analysis.limitations;
 return report;
}
