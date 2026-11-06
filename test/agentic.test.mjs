import test from 'node:test';import assert from 'node:assert/strict';
import {OpenRouterProvider} from '../src/swarm/provider.mjs';
import {investigate} from '../src/swarm/investigate.mjs';
import {feasibilityEnvironment,deterministicFeasibility,reconcileFeasibility,semanticKey} from '../src/swarm/feasibility.mjs';
import {classifyOutcome} from '../src/swarm/outcome.mjs';
import {candidate,roleTransport,modelResponse} from '../scripts/test-support/agentic.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const provider=fetchImpl=>new OpenRouterProvider({env:{OPENROUTER_API_KEY:'mock-not-real'},fetchImpl,testTransport:true});
const context=env=>({profile:env.profile,sourceDigests:{authorization:env.auth.contract.sourceDigest}});

test('feasibility checks actual ABI, roles, identities, funding dependencies and duplicates',async()=>{
 const env=await feasibilityEnvironment(),p=candidate(context(env));
 assert.equal((await deterministicFeasibility(p,env)).decision,'EXECUTABLE');
 for(const bad of [{...p,targetFunction:'withdraw(uint256)'},{...p,contractRole:'PAYMASTER'},{...p,sourceDigest:'0'.repeat(64)},{...p,profile:'future-profile'}])assert.equal((await deterministicFeasibility(bad,env)).decision,'INVALID');
 const conditional=await deterministicFeasibility({...p,requiredPreconditions:['FUNDED_PAYER']},env);assert.equal(conditional.decision,'CONDITIONAL');
 assert.equal((await deterministicFeasibility(p,env,{seen:new Set([semanticKey(p)])})).decision,'DUPLICATE');
 assert.equal((await deterministicFeasibility({...p,verificationMethod:'LIVE_ADMISSION'},env)).decision,'UNSUPPORTED');
 const stale={...env,compilerInputDigest:'stale-source-identity'};assert.equal((await deterministicFeasibility(p,stale)).decision,'INVALID');
 const gates=await deterministicFeasibility({...p,targetFunction:'withdraw(uint256)'},env);
 const effective=reconcileFeasibility({decision:'EXECUTABLE',factIds:['record-abi'],reason:'Incorrect model recommendation'},gates,env);
 assert.equal(effective.decision,'INVALID');assert.equal(effective.disagreement,true);
});
test('expected negative authorization survives; outcomes distinguish observations, predictions and transport',()=>{
 const base={expectedVerdict:'REJECT',executionMode:'OFFLINE_SIGNATURE_BINDING',provenance:'LOCAL_ECDSA_RECOVERY',prerequisitesVerified:true};
 assert.equal(classifyOutcome({...base,observedVerdict:'REJECT'}).classification,'XFAIL');
 const unexpected=classifyOutcome({...base,observedVerdict:'ACCEPT'});assert.equal(unexpected.classification,'XPASS');assert.equal(unexpected.findingCandidate,true);assert.equal(unexpected.verifiedVulnerability,false);
 assert.equal(classifyOutcome({...base,expectedVerdict:'ACCEPT',observedVerdict:'ACCEPT'}).classification,'PASS');
 assert.equal(classifyOutcome({...base,expectedVerdict:'ACCEPT',observedVerdict:'REJECT'}).classification,'FAIL');
 assert.equal(classifyOutcome(base).classification,'INCONCLUSIVE');
 assert.equal(classifyOutcome({...base,executionMode:'POLICY_PREDICTION',observedVerdict:'ACCEPT'}).observedVerdict,null);
 assert.equal(classifyOutcome({...base,executionMode:'POLICY_PREDICTION'}).classification,'PREDICTED');
 assert.equal(classifyOutcome({...base,infrastructureFailure:true,observedVerdict:'ACCEPT'}).classification,'INCONCLUSIVE');
});
test('real provider path uses distinct role calls, repair feedback and actual executor observations under mocked transport',async()=>{
 const roles=[],inputs={};const p=provider(roleTransport({invalid:true,wrongValidator:true,inspect:(role,c)=>{roles.push(role);inputs[role]=c;}}));
 const report=await investigate({mode:'openrouter',authorizeProvider:true,provider:p});
 assert.equal(report.status,'COMPLETE_OFFLINE_INVESTIGATION',report.error);
 assert.deepEqual(roles,['scout','mutation','validator','mutation_repair','validator','critic']);
 assert.equal(report.revisions.length,1);assert.equal(report.proposals.length,3);assert.equal(report.rejectedDeferred.length,1);
 assert.equal(report.proposals[0].feasibility.decision,'INVALID');assert.equal(report.proposals[0].feasibility.disagreement,true);
 assert.equal(inputs.mutation_repair.feedback.decision,'INVALID');assert.equal(report.revisions[0].candidate.mutatedInput.operation,3);
 assert.equal(report.experiments.length,2);assert.equal(inputs.critic.observations.length,2);
 assert.equal(inputs.critic.observations[0].observation.results.safe.tamperedOwnerRecovered,false);
 assert.ok(report.proposals.some(p=>p.outcomes?.some(o=>o.classification==='XFAIL')));
 assert.equal(report.realLLMCalls,0);assert.equal(report.finding,false);assert.equal(report.broadcasts,0);
 assert.equal(report.experiments.find(e=>e.proposalId==='auth-1').independentReplay.equivalentSemanticProperties,true);
});
test('malformed or failed real provider calls stop without simulated fallback or tool results',async()=>{
 for(const transport of [async()=>modelResponse({invalid:'schema'}),async()=>new Response('',{status:503})]){
  const report=await investigate({mode:'openrouter',authorizeProvider:true,provider:provider(transport)});
  assert.equal(report.status,'INCOMPLETE');assert.equal(report.experiments.length,0);assert.equal(report.agentMessages[0].state,'FAILED');assert.equal(report.proposals.length,0);
 }
 const p=new OpenRouterProvider({env:{},fetchImpl:()=>assert.fail('must not send')});
 const missing=await investigate({mode:'openrouter',authorizeProvider:true,provider:p});assert.equal(missing.status,'INCOMPLETE');assert.equal(missing.experiments.length,0);assert.equal(missing.source,'OPENROUTER_MODEL_INVESTIGATION');
});
test('above-boundary gas negatives reach the genuine unsigned policy tool and remain PREDICTED',async()=>{
 const standard=roleTransport();
 const p=provider(async(url,request)=>{
  const body=JSON.parse(request.body),role=body.response_format.json_schema.name,ctx=JSON.parse(body.messages[1].content).untrusted;
  if(role==='framefuzz_mutation')return modelResponse({candidates:[candidate(ctx,{id:'gas-1',suite:'verification-gas',targetFunction:'verificationGasLimit',contractRole:'PAYMASTER',sourceDigest:ctx.sourceDigests.paymaster,originalInput:ctx.originalGas,mutatedInput:{operation:1,parameter:10,verificationGasLimit:67201},ruleId:'MAX_VERIFY_GAS',verificationMethod:'POLICY_PREDICTION',expectedVerdict:{unsafe:'REJECT',safe:'REJECT'},requiredPreconditions:['SOURCE_IDENTITY']})]});
  return standard(url,request);
 });
 const r=await investigate({mode:'openrouter',authorizeProvider:true,provider:p});assert.equal(r.status,'COMPLETE_OFFLINE_INVESTIGATION',r.error);
 assert.equal(r.proposals[0].state,'EXECUTED');assert.equal(r.proposals[0].outcomes[0].classification,'PREDICTED');assert.equal(r.proposals[0].outcomes[0].observedVerdict,null);
 assert.equal(r.predictions[0].result.actual,null);assert.equal(r.predictions[0].result.expected.expected,'rejected');
});
test('semantically duplicate model hypotheses cannot execute twice under different IDs',async()=>{
 const standard=roleTransport();
 const p=provider(async(url,request)=>{
  const body=JSON.parse(request.body),context=JSON.parse(body.messages[1].content).untrusted;
  if(body.response_format.json_schema.name==='framefuzz_mutation')return modelResponse({candidates:[candidate(context),candidate(context,{id:'another-id'})]});
  return standard(url,request);
 });
 const r=await investigate({mode:'openrouter',authorizeProvider:true,provider:p});assert.equal(r.status,'COMPLETE_OFFLINE_INVESTIGATION',r.error);assert.equal(r.experiments.length,1);
 assert.equal(r.proposals[1].feasibility.decision,'DUPLICATE');assert.equal(r.proposals[1].outcomes[1].expectedVerdict,'REJECT');assert.equal(r.proposals[1].outcomes[1].observedVerdict,null);
 assert.equal(r.proposals[1].outcomes[1].classification,'SKIPPED_DUPLICATE');assert.equal(r.revisions.length,0);
});
