import {readFile} from 'node:fs/promises';
import {prepareContractAnalysis,generateSemanticTests,supportedContext,PROFILE} from '../analysis/service.mjs';
import {compileOwnedFixtures} from './compile.mjs';
import {sha256,digest} from '../analysis/model.mjs';
import {CANDIDATE,validateStructured} from './agent-schema.mjs';
import {OFFLINE_CONTEXT} from './experiment.mjs';

/** Fixed supported fixtures only; descriptive model references never become paths or tools. */
export async function feasibilityEnvironment(){
 const sources={},facts=[];
 for(const file of ['contracts/SenderValidatorUnsafe.sol','contracts/SenderValidatorSafe.sol','contracts/OwnedValidatorBase.sol','contracts/ActionRecorder.sol','vendor/paymaster/ReserveReadingPaymaster.sol','rules/devnet-1337.v1.json']){
  const content=await readFile(new URL('../../'+file,import.meta.url),'utf8');sources[file]={content,sha256:sha256(content)};
 }
 const needles=[['unsafe-binding','contracts/SenderValidatorUnsafe.sol','return keccak256'],['safe-binding','contracts/SenderValidatorSafe.sol','return bytes32'],['frame-layout','contracts/OwnedValidatorBase.sol','FRAME_COUNT'],['payer-scope','contracts/OwnedValidatorBase.sol','uint160(PAYER)'],['owner-check','contracts/OwnedValidatorBase.sol','ecrecover('],['execution-scope','contracts/OwnedValidatorBase.sol','approve(Scope.EXECUTION)'],['record-abi','contracts/ActionRecorder.sol','function record'],['pool-read','vendor/paymaster/ReserveReadingPaymaster.sol','IStateView(STATE_VIEW).getSlot0']];
 for(const [id,file,needle]of needles){const lines=sources[file].content.split(/\r?\n/),index=lines.findIndex(l=>l.includes(needle));if(index<0)throw Error('Supported source fact missing: '+id);facts.push({id,file,line:index+1,quote:lines[index].trim(),sourceDigest:sources[file].sha256});}
 for(const [id,needle]of [['gas-cap','"maxTotal"'],['sender-gas','"senderExecution"'],['signature-gas','"signatureCost"']]){const file='rules/devnet-1337.v1.json',lines=sources[file].content.split(/\r?\n/),index=lines.findIndex(l=>l.includes(needle));if(index<0)throw Error('Policy fact missing');facts.push({id,file,line:index+1,quote:lines[index].trim(),sourceDigest:sources[file].sha256});}
 const input=file=>({schema:'framefuzz.contract-input.v1',kind:'SOLIDITY_SOURCE',source:{content:sources[file].content,fileId:file},role:'UNKNOWN'});
 const context=supportedContext(),auth=await prepareContractAnalysis(input('contracts/SenderValidatorUnsafe.sol'),context),gas=await prepareContractAnalysis(input('vendor/paymaster/ReserveReadingPaymaster.sol'),context);
 const gasTests=await generateSemanticTests(gas,{count:7,seed:42});
 const compilation=await compileOwnedFixtures();
 // ABI identity comes from the actual locally compiled recorder, not a model claim.
 const record=compilation.artifacts.ActionRecorder.abi.find(f=>f.type==='function'&&f.name==='record');
 if(!record||record.inputs.map(i=>i.type).join(',')!=='uint256,uint256')throw Error('Unsupported ActionRecorder ABI');
 return {schema:'framefuzz.feasibility-context.v1',profile:PROFILE,sources,facts,auth,gas,gasTests,compilerInputDigest:compilation.inputDigest,sourceDigests:compilation.sourceDigests,
  accounts:OFFLINE_CONTEXT,abi:{record},availableModes:['OFFLINE_SIGNATURE_BINDING','POLICY_PREDICTION'],liveState:{funding:'UNKNOWN',nonce:'UNKNOWN',deployment:'UNKNOWN',stake:'UNKNOWN',runtime:'UNKNOWN'},
  limits:{candidates:2,repairsPerProposal:1,executions:2,reproductions:1,broadcasts:0,paidToolCalls:0}};
}
export const semanticKey=p=>digest({suite:p.suite,sourceDigest:p.sourceDigest,profile:p.profile,method:p.verificationMethod,target:p.targetFunction,original:p.originalInput,modified:p.mutatedInput});
export async function deterministicFeasibility(proposal,env,{seen=new Set(),writes=false}={}){
 validateStructured(proposal,CANDIDATE);const gates=[];
 const gate=(id,ok,reason,decision='INVALID')=>gates.push({id,passed:Boolean(ok),reason,decision:ok?'EXECUTABLE':decision});
 gate('SCHEMA',true,'Strict bounded candidate schema validated');
 gate('NO_WRITES',!writes,'Only local crypto and unsigned policy prediction are permitted','UNSUPPORTED');
 gate('DUPLICATION',!seen.has(semanticKey(proposal)),'Semantic identity includes source, context, mode and both inputs','DUPLICATE');
 const auth=proposal.suite==='frame-authorization',gas=proposal.suite==='verification-gas',prepared=auth?env.auth:env.gas;
 gate('EXECUTOR_FAMILY',auth||gas,'Storage/live execution is not implemented by this investigator','UNSUPPORTED');
 if(!auth&&!gas)return {decision:'UNSUPPORTED',gates,prerequisitesVerified:false,reason:'No investigator tool implements this family',intentionalNegative:proposal.intentionalNegative,semanticKey:semanticKey(proposal)};
 gate('ROLE',proposal.contractRole===(auth?'SENDER_VALIDATOR':'PAYMASTER'),'Declared role must match the exact supported source fixture');
 gate('SOURCE_IDENTITY',proposal.sourceDigest===prepared.contract.sourceDigest,'Proposal must bind the current complete source digest');
 // Re-read compilation inputs before each execution; changes to bases/dependencies invalidate the run too.
 const current=await compileOwnedFixtures();
 const currentSource=await readFile(new URL('../../'+(auth?'contracts/SenderValidatorUnsafe.sol':'vendor/paymaster/ReserveReadingPaymaster.sol'),import.meta.url));
 gate('CURRENT_SOURCE_IDENTITY',current.inputDigest===env.compilerInputDigest&&sha256(currentSource)===prepared.contract.sourceDigest,'Current fixture/base/compiler bytes must match the inspected environment');
 gate('PROFILE_LAYOUT',proposal.profile===PROFILE&&prepared.capabilities.includes(auth?'OWNED_OFFLINE_CRYPTO':'GAS_BUDGET_PREDICTION'),'Pinned profile and supported three-frame layout required');
 gate('TARGET_ABI',proposal.targetFunction===(auth?'record(uint256,uint256)':'verificationGasLimit'),'Only the actual compiled record ABI or unsigned gas-budget field is supported');
 gate('RULE',proposal.ruleId===(auth?'OWNER_INTENT_BINDING':'MAX_VERIFY_GAS'),'Rule must match the implemented tool');
 const a=proposal.originalInput,b=proposal.mutatedInput;
 gate('ORIGINAL_INPUT',a.operation===1&&a.parameter===10&&a.verificationGasLimit===(auth?0:env.gasTests[0].originalInput.verificationGasLimit),'Original action/budget must match the fixed fixture baseline');
 gate('MUTATION',auth?(b.verificationGasLimit===0&&(b.operation!==1||b.parameter!==10)):(b.operation===1&&b.parameter===10&&env.gasTests.some(t=>t.modifiedInput.verificationGasLimit===b.verificationGasLimit)),'Mutation must change the intended field within the existing executor range');
 gate('ACCOUNT_CONTEXT',env.accounts?.nonce===0&&env.accounts?.chainId===1337&&Boolean(env.accounts?.payer&&env.accounts?.target&&env.accounts?.senders?.unsafe&&env.accounts?.senders?.safe),'Offline sender/payer/target and nonce are explicit virtual context','CONDITIONAL');
 const runtime=proposal.requiredPreconditions.filter(p=>['FUNDED_PAYER','FRESH_NONCE','DEPLOYED_CODE','STAKE','COMPATIBLE_RUNTIME'].includes(p));
 gate('RUNTIME_PREREQUISITES',runtime.length===0,'Unknown runtime requirements: '+(runtime.join(', ')||'none required for this local method'),'CONDITIONAL');
 gate('EXECUTION_MODE',proposal.verificationMethod===(auth?'OFFLINE_SIGNATURE_BINDING':'POLICY_PREDICTION'),'No live or EVM executor is enabled','UNSUPPORTED');
 const failed=gates.filter(g=>!g.passed);
 // Contradictory input is invalid; missing state is conditional; unsupported capability is deferred.
 const decision=failed.some(g=>g.decision==='INVALID')?'INVALID':failed.some(g=>g.decision==='DUPLICATE')?'DUPLICATE':failed.some(g=>g.decision==='CONDITIONAL')?'CONDITIONAL':failed.length?'UNSUPPORTED':'EXECUTABLE';
 return {decision,gates,prerequisitesVerified:decision==='EXECUTABLE',reason:failed.map(g=>g.id+': '+g.reason).join('; ')||'All local deterministic gates passed',intentionalNegative:proposal.intentionalNegative,semanticKey:semanticKey(proposal)};
}
export function reconcileFeasibility(model,deterministic,env){
 const referencesValid=model.factIds.length>0&&model.factIds.every(id=>env.facts.some(f=>f.id===id));
 const disagreement=model.decision!==deterministic.decision||!referencesValid;
 const decision=!referencesValid?'INVALID':deterministic.decision!=='EXECUTABLE'?deterministic.decision:model.decision;
 return {...deterministic,decision,prerequisitesVerified:decision==='EXECUTABLE'&&deterministic.prerequisitesVerified,modelDecision:model.decision,modelReason:model.reason,references:model.factIds.map(id=>env.facts.find(f=>f.id===id)).filter(Boolean),disagreement,referencesValid};
}
