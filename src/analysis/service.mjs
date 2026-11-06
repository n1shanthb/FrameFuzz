import {readFile} from 'node:fs/promises';
import {contractInput,analysisContext,normalizedResult,digest,sha256,boundedJSON,keys,fail,AnalysisError,LIMITS} from './model.mjs';
import {loadMutationDefinition} from '../mutations/campaign.mjs';
import {generateMutations,regenerateMutation} from '../mutations/generator.mjs';
import {frameMutationDefinition,generateFrameMutation,replayFrameMutation} from '../mutations/frames.mjs';
import {executeMutation,OFFLINE_CONTEXT} from '../swarm/experiment.mjs';
import {compileOwnedFixtures} from '../swarm/compile.mjs';
import {unsignedValidatorTransaction} from '../adapters/sender-validator.mjs';
import {workshopSigningHash,WORKSHOP_HASH} from '../swarm/signatures.mjs';

const KNOWN_SOURCES={unsafe:'contracts/SenderValidatorUnsafe.sol',safe:'contracts/SenderValidatorSafe.sol',paymaster:'vendor/paymaster/ReserveReadingPaymaster.sol'};
export const PROFILE=WORKSHOP_HASH;
export const supportedContext=()=>({schema:'framefuzz.analysis-context.v1',profile:PROFILE,chainId:1337,path:'public',frameLayout:[{mode:1,flags:2},{mode:1,flags:1},{mode:2,flags:0}],verificationGas:{senderExecution:30000,signatureCost:2800,maxTotal:100000}});
// Fixed repository paths only. Source IDs and user evidence references are never resolved.
async function sourceBinding(input){if(!input.sourceDigest)return null;for(const [kind,file]of Object.entries(KNOWN_SOURCES))if(sha256(await readFile(new URL('../../'+file,import.meta.url)))===input.sourceDigest)return {kind,file,sourceDigest:input.sourceDigest};return null;}
export async function prepareContractAnalysis(input,context){
 const contract=contractInput(input),ctx=analysisContext(context),binding=await sourceBinding(contract);
 const inferred=binding?.kind==='paymaster'?'PAYMASTER':binding?'SENDER_VALIDATOR':'UNKNOWN';
 const effectiveRole=contract.role==='UNKNOWN'?inferred:contract.role;
 const missing=[];
 if(!['PAYMASTER','SENDER_VALIDATOR'].includes(effectiveRole))missing.push('VALIDATION_ROLE_OR_INTEGRATION');
 if(ctx.profile!==PROFILE)missing.push('SUPPORTED_WORKSHOP_PROFILE');
 if(ctx.chainId!==1337)missing.push('SUPPORTED_CHAIN_1337');
 if(ctx.clientCommit&&ctx.clientCommit!=='9aa3645d795945c64400f41a70aace0edfa7f383')missing.push('CLIENT_PROFILE_MISMATCH');
 if(contract.deployment&&ctx.chainId!==contract.deployment.chainId)missing.push('DEPLOYMENT_CHAIN_MISMATCH');
 const layout=ctx.frameLayout;if(!layout||layout.length!==3||layout.some((f,i)=>f.mode!==[1,1,2][i]||f.flags!==[2,1,0][i]))missing.push('SUPPORTED_THREE_FRAME_LAYOUT');
 if(binding&&contract.role!=='UNKNOWN'&&contract.role!==inferred)missing.push('DECLARED_ROLE_CONFLICTS_WITH_KNOWN_SOURCE');
 const capabilities=[];
 if(layout?.some(f=>f.target!==undefined))missing.push('EXPLICIT_FRAME_TARGETS_UNSUPPORTED');
 if(effectiveRole==='PAYMASTER'){
  if(!ctx.path)missing.push('ADMISSION_PATH');
  if(digest(ctx.verificationGas??{})!==digest({senderExecution:30000,signatureCost:2800,maxTotal:100000}))missing.push('SUPPORTED_GAS_COMPONENTS');
  if(!missing.length)capabilities.push('GAS_BUDGET_PREDICTION');
 }
 if(effectiveRole==='SENDER_VALIDATOR'){
  if(!binding||!['unsafe','safe'].includes(binding.kind))missing.push('KNOWN_OWNED_VALIDATOR_SOURCE');
  if(['sender','payer','executionTarget','nonceSeq'].some(k=>ctx[k]!==undefined))missing.push('OFFLINE_EXECUTOR_CONTEXT_OVERRIDES_UNSUPPORTED');
  if(!missing.length)capabilities.push('OWNED_OFFLINE_CRYPTO');
 }
 return {schema:'framefuzz.prepared-analysis.v1',contract,context:ctx,contractDigest:contract.contentDigest,contextDigest:digest(ctx),
  role:{declared:contract.role,effective:effectiveRole,basis:contract.role!=='UNKNOWN'?'USER_DECLARATION':binding?'EXACT_REPOSITORY_SOURCE_DIGEST':'UNKNOWN'},
  sourceBinding:binding,capabilities,missingPrerequisites:missing,
  livePrerequisites:['CURRENT_CLIENT_AND_RULE_VERIFICATION','DEPLOYED_CODE_AND_ROLE_INTEGRATION','FUNDING_AND_STAKE_CHECKS','FRESH_PER_PATH_ACCOUNT_NONCES','EXPLICIT_LIVE_AUTHORIZATION'],
  restrictions:{arbitraryCompilation:false,network:false,providerCalls:false,userKeys:false,broadcast:false},
  scope:'Metadata validation and supported fixture adapters only; no universal Solidity or deployed-contract analysis'};
}
function projectGasDescriptor(input){
 boundedJSON(input);const v=regenerateMutation(input);fail(v.suite==='verification-gas','UNSUPPORTED_FAMILY','Only gas-budget v1 is supported here');
 fail(v.descriptor.definition.count<=LIMITS.tests,'INPUT_LIMIT','At most seven generated cases');return v.descriptor;
}
function makeSpec(prepared,engine,descriptor){
 const gas=engine==='mutation-v1',variant=gas?regenerateMutation(descriptor):replayFrameMutation(descriptor);
 const body={schema:'framefuzz.semantic-test.v1',engine,contract:prepared.contract,context:prepared.context,contractDigest:prepared.contractDigest,contextDigest:prepared.contextDigest,
  role:prepared.role.effective,family:gas?'verification-gas':'frame-authorization',seed:gas?descriptor.definition.seed:descriptor.definition.seed,
  descriptor,originalInput:gas?descriptor.definition.baseTemplate.model:variant.authorized,modifiedInput:gas?variant.unsignedModel:variant.tampered,
  rule:gas?{id:'MAX_VERIFY_GAS',profile:PROFILE,version:descriptor.definition.ruleModel.version}:{id:'OWNER_INTENT_BINDING',profile:PROFILE,version:'owned-validator-v1'},
  expectedObservation:gas?variant.oracle[prepared.context.path]:{kind:'SIGNATURE_BINDING_DIFFERENTIAL_HYPOTHESIS',admission:null},
  requiredPreconditions:gas?prepared.livePrerequisites:['EXPLICIT_SWARM_OFFLINE_OPT_IN','COMPILED_OWNED_FIXTURE_SOURCE_MATCH'],
  executionMethod:gas?'POLICY_PREDICTION':'OFFLINE_EXECUTED',evidenceRequirements:gas?['ACTUAL_ADMISSION_RPC_REQUIRED_FOR_OBSERVATION']:['REAL_ECDSA_RECOVERY','CANONICAL_HASH_COMPARISON','NO_EVM_EXECUTION_CLAIM']};
 return {...body,descriptorHash:digest(body)};
}
export async function generateSemanticTests(prepared,options={}){
 boundedJSON(options);keys(options,['family','seed','count','operation','parameter','descriptor']);
 const fresh=await prepareContractAnalysis(prepared.contract,prepared.context);
 fail(prepared.contractDigest===fresh.contractDigest&&prepared.contextDigest===fresh.contextDigest,'DIGEST_MISMATCH','Prepared input/context changed');
 const family=options.family??(fresh.role.effective==='PAYMASTER'?'verification-gas':'frame-authorization');
 const required=family==='verification-gas'?'GAS_BUDGET_PREDICTION':family==='frame-authorization'?'OWNED_OFFLINE_CRYPTO':null;
 if(!required||!fresh.capabilities.includes(required))throw new AnalysisError('MISSING_PREREQUISITES','Unsupported analysis capability',fresh.missingPrerequisites.length?fresh.missingPrerequisites:['SUPPORTED_ROLE_AND_FAMILY']);
 if(family==='verification-gas'){
  const definition=await loadMutationDefinition({seed:options.seed??42,count:options.count??7});
  fail(definition.count<=LIMITS.tests,'INPUT_LIMIT','At most seven cases');
  const descriptors=options.descriptor?[projectGasDescriptor(options.descriptor)]:generateMutations(definition).map(v=>v.descriptor);
  const trustedRules=definition.ruleModel;
  for(const d of descriptors)fail(digest(d.definition.ruleModel)===digest(trustedRules),'UNTRUSTED_POLICY','Only the existing locally verified policy profile is supported');
  return descriptors.map(d=>makeSpec(fresh,'mutation-v1',d));
 }
 fail((options.count??1)===1,'INPUT_LIMIT','One bounded authorization experiment per evaluation');
 const descriptor=options.descriptor?replayFrameMutation(options.descriptor):generateFrameMutation(frameMutationDefinition({seed:options.seed??42,operation:options.operation??2,parameter:options.parameter??10}));
 fail(descriptor.tampered.operation<=65535&&descriptor.tampered.parameter<=1000000,'INPUT_LIMIT','Existing investigator mutation bounds required');
 return [makeSpec(fresh,'authorization-v2',descriptor)];
}
export function analysisResult(prepared){return normalizedResult({schema:'framefuzz.analysis-result.v1',classification:'UNVERIFIED',kind:'CONTRACT_ANALYSIS',contractDigest:prepared.contractDigest,profile:prepared.context.profile??null,
 supportedContext:prepared.context,mutation:null,expected:null,actual:null,provenance:{kind:'UNTRUSTED_INPUT',references:[]},confidence:'UNKNOWN',missingPrerequisites:prepared.missingPrerequisites,
 actionEvidence:{verified:false},execution:{broadcasts:0,paidModelCalls:0,userKeysUsed:false,evmExecuted:false},reproduction:null});}
export async function evaluateSemanticTest(spec,executionMode){
 boundedJSON(spec);keys(spec,['schema','engine','contract','context','contractDigest','contextDigest','role','family','seed','descriptor','originalInput','modifiedInput','rule','expectedObservation','requiredPreconditions','executionMethod','evidenceRequirements','descriptorHash']);
 const {descriptorHash,...body}=spec;fail(spec.schema==='framefuzz.semantic-test.v1'&&digest(body)===descriptorHash,'DIGEST_MISMATCH','Semantic specification integrity mismatch');
 fail(executionMode===spec.executionMethod&&['POLICY_PREDICTION','OFFLINE_EXECUTED'].includes(executionMode),'UNSUPPORTED_MODE','No live, simulation or silent fallback execution mode');
 const prepared=await prepareContractAnalysis(spec.contract,spec.context);
 const [rebuilt]=await generateSemanticTests(prepared,{family:spec.family,descriptor:spec.descriptor});
 fail(digest(rebuilt)===digest(spec),'SPEC_MISMATCH','Specification differs from regenerated semantic inputs');
 let actual=null,confidence='PREDICTION_ONLY',kind='POLICY_PREDICTION',references=[];
 if(executionMode==='OFFLINE_EXECUTED'){
  const compiled=await compileOwnedFixtures();
  fail(compiled.sourceDigests[prepared.sourceBinding.file]===prepared.contract.sourceDigest,'SOURCE_MISMATCH','Compiled source differs from analyzed fixture');
  const observation=await executeMutation(spec.descriptor),canonicalHashes={};
  for(const fixture of ['unsafe','safe']){
   const tx=data=>unsignedValidatorTransaction({sender:OFFLINE_CONTEXT.senders[fixture],payer:OFFLINE_CONTEXT.payer,target:OFFLINE_CONTEXT.target,nonce:OFFLINE_CONTEXT.nonce,data});
   canonicalHashes[fixture]={original:workshopSigningHash(tx(spec.originalInput.data)),modified:workshopSigningHash(tx(spec.modifiedInput.data))};
  }
  actual={semanticProperties:observation.semanticProperties,verdict:observation.verdict,canonicalHashes,appliedContext:OFFLINE_CONTEXT,finding:false};
  confidence='OFFLINE_CRYPTO_VERIFIED';kind='OFFLINE_CRYPTOGRAPHY';references=[{compiler:compiled.compiler,inputDigest:compiled.inputDigest,sourceDigests:compiled.sourceDigests}];
 }
 return normalizedResult({schema:'framefuzz.analysis-result.v1',classification:executionMode,kind,contractDigest:spec.contractDigest,profile:PROFILE,ruleVersion:spec.rule.version,supportedContext:spec.context,
  mutation:{definition:spec.descriptor,descriptorHash:spec.descriptorHash,original:spec.originalInput,modified:spec.modifiedInput},expected:spec.expectedObservation,actual,
  provenance:{kind:executionMode==='OFFLINE_EXECUTED'?'LOCAL_OFFLINE_EXECUTION':'LOCAL_POLICY_MODEL',references},confidence,missingPrerequisites:prepared.livePrerequisites,
  actionEvidence:{verified:false},execution:{broadcasts:0,paidModelCalls:0,userKeysUsed:false,evmExecuted:false},reproduction:{test:spec,mode:executionMode},limitations:['No deployed code, account state, public/alternative admission or EVM action execution verified']});
}
