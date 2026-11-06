import {encodeFunctionData} from 'viem';
import {boundedJSON,digest,keys} from '../analysis/model.mjs';
import {classifyOutcome} from '../swarm/outcome.mjs';
export const TOOLS=Object.freeze([
 {id:'compiler_abi',roles:['UNKNOWN','EXECUTION_TARGET','SENDER_VALIDATOR','PAYMASTER'],mode:'STATIC_COMPILER',evidence:'Actual solc ABI/AST diagnostics',sideEffects:'LOCAL_PROCESS_ONLY',limits:'64KiB source,8s,192MiB heap,384MiB sampled RSS',prerequisites:['SELF_CONTAINED_SOLIDITY_0.8.28']},
 {id:'inspect_source',roles:['ANY'],mode:'STATIC_SOURCE',evidence:'Exact submitted source ranges and digest',sideEffects:'NONE',limits:'1..20 lines,2000 bytes',prerequisites:['ANALYSIS_ID']},
 {id:'query_abi',roles:['ANY'],mode:'STATIC_COMPILER',evidence:'Compiler-produced signatures/types',sideEffects:'NONE',limits:'48 functions',prerequisites:['SUCCESSFUL_COMPILATION']},
 {id:'capabilities',roles:['ANY'],mode:'STATIC_METADATA',evidence:'Tool capabilities, not runtime evidence',sideEffects:'NONE',limits:'Fixed registry',prerequisites:[]},
 {id:'feasibility',roles:['ANY'],mode:'STATIC_FEASIBILITY',evidence:'Compiler/ABI-bound deterministic checks',sideEffects:'NONE',limits:'2 proposals per batch',prerequisites:['SOURCE_AND_ANALYSIS_IDENTITY']},
 {id:'typed_descriptor',roles:['ANY'],mode:'OFFLINE_TYPED_MUTATION',evidence:'Source/ABI-bound original and mutated inputs with integrity digest',sideEffects:'NONE',limits:'8 bounded scalar args',prerequisites:['DETERMINISTIC_FEASIBILITY']},
 {id:'abi_encode',roles:['ANY'],mode:'OFFLINE_ABI_ENCODING',evidence:'Actual ABI encoding of encodable values, or ABI_TOOL_TEST encoder rejection; never Solidity runtime',sideEffects:'NONE',limits:'8 scalar args,256-byte strings/bytes',prerequisites:['COMPILED_CALLABLE_FUNCTION']},
 {id:'structure_check',roles:['ANY'],mode:'STATIC_AST',evidence:'Guard/call-site syntax, not runtime reachability',sideEffects:'NONE',limits:'Fixed compiled AST facts',prerequisites:['COMPILED_FUNCTION']},
 {id:'historical_evidence',roles:['PAYMASTER','ANY'],mode:'HISTORICAL_READ',evidence:'Saved live admission captures with exact provenance; not a fresh execution',sideEffects:'NONE',limits:'Pinned evidence digests only',prerequisites:['UNISWAP_PROFILE_OR_SAVED_EVIDENCE']},
 {id:'uniswap_context',roles:['PAYMASTER','ANY'],mode:'STATIC_METADATA',evidence:'Pinned StateView/getSlot0 paymaster context and supported mutation families',sideEffects:'NONE',limits:'Local files and pinned config',prerequisites:['UNISWAP_PROFILE']},
 {id:'replay',roles:['ANY'],mode:'OFFLINE_ABI_ENCODING',evidence:'Repeat of source-bound local static tool',sideEffects:'NONE',limits:'1 per investigation',prerequisites:['EXECUTED_DESCRIPTOR']},
].map(tool=>({...tool,cost:{paidUSD:0,resource:'Bounded local CPU/memory'},inputSchema:'framefuzz.byoc-tool-input.v1',outputSchema:'framefuzz.byoc-'+tool.id+'-output.v1'})));
const scalar=/^(?:u?int(?:8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|address|bool|bytes(?:[1-9]|[12]\d|3[0-2])?|string)$/;
export function encodeInputs(analysis,signature,args){
 const fn=analysis.functions.find(f=>f.signature===signature);if(!fn)throw Error('FUNCTION_NOT_IN_COMPILED_ABI');
 if(fn.inputs.length>8||fn.inputs.some(p=>!scalar.test(p.type)))throw Error('ABI_TYPE_UNSUPPORTED');
 if(!Array.isArray(args)||args.length!==fn.inputs.length)throw Error('ABI_ARGUMENT_COUNT');
 const values=fn.inputs.map((p,i)=>{
  const v=args[i];if(typeof v!=='string'||v.length>600)throw Error('ABI_ARGUMENT_SIZE');
  if(/^u?int/.test(p.type)){if(!/^-?(0|[1-9]\d{0,77})$/.test(v))throw Error('ABI_INTEGER_REQUIRED');const n=BigInt(v),signed=p.type.startsWith('int'),bits=BigInt(Number(p.type.replace(/\D/g,'')||256));if(n<(signed?-(1n<<(bits-1n)):0n)||n>(signed?(1n<<(bits-1n))-1n:(1n<<bits)-1n))throw Error('ABI_INTEGER_RANGE');return n;}
  if(p.type==='bool'){if(!['true','false'].includes(v))throw Error('ABI_BOOLEAN_REQUIRED');return v==='true';}
  if(p.type==='address'){if(!/^0x[\da-f]{40}$/i.test(v))throw Error('ABI_ADDRESS_REQUIRED');return v;}
  if(p.type.startsWith('bytes')){if(!/^0x(?:[\da-f]{2})*$/i.test(v)||v.length>514||p.type!=='bytes'&&v.length!==2+2*Number(p.type.slice(5)))throw Error('ABI_BYTES_LENGTH');return v;}
  if(Buffer.byteLength(v)>256)throw Error('ABI_STRING_SIZE');return v;
 });
 const abi=analysis.abi.find(a=>a.type==='function'&&a.name===fn.name&&digest(a.inputs)===digest(fn.inputs));
 return encodeFunctionData({abi:[abi],functionName:fn.name,args:values});
}
export function proposalKey(p){return digest({analysisId:p.analysisId,sourceDigest:p.sourceDigest,tool:p.tool,domain:p.domain,signature:p.functionSignature,original:p.originalArgs,mutated:p.mutatedArgs});}
export function checkProposal(p,analysis,{seen=new Set()}={}){
 const checks=[],check=(id,ok,reason,decision='INVALID')=>checks.push({id,passed:!!ok,reason,decision:ok?'EXECUTABLE':decision});
 const profileTool=['historical_evidence','uniswap_context'].includes(p.tool);
 check('IDENTITY',p.analysisId===analysis.analysisId&&p.sourceDigest===analysis.sourceDigest,'Exact compiled source/selection binding required');
 check('FUNCTION',profileTool||(analysis.functions??[]).some(f=>f.signature===p.functionSignature),profileTool?'Profile tools bind to pinned Uniswap/historical context rather than compiled ABI selectors':'Target must exist in the actual compiled external ABI');
 check('CITATIONS',p.factIds.length>0&&p.factIds.every(id=>analysis.sourceFacts.some(f=>f.id===id)),'Only real submitted-source AST references are accepted');
 check('DUPLICATE',!seen.has(proposalKey(p)),'This semantic test has already been reserved or executed','DUPLICATE');
 check('CHANGE',digest(p.originalArgs)!==digest(p.mutatedArgs),'Original and mutation must differ');
 const fn=(analysis.functions??[]).find(f=>f.signature===p.functionSignature);
 check('SUPPORTED_TYPES',!fn||fn.inputs.length<=8&&fn.inputs.every(x=>scalar.test(x.type)),'Nested ABI values/arrays and more than8 arguments need another executor','UNSUPPORTED');
 let originalError,mutationError;
 if(!profileTool&&p.tool==='abi_encode'){try{encodeInputs(analysis,p.functionSignature,p.originalArgs);}catch(e){originalError=e.message;}try{encodeInputs(analysis,p.functionSignature,p.mutatedArgs);}catch(e){mutationError=e.message;}}
 const unsupported=!profileTool&&(fn?.inputs.some(x=>!scalar.test(x.type))||fn?.inputs.length>8);
 const abiToolTest=p.domain==='ABI_TOOL_TEST'&&p.negativeObjective==='ABI_REJECTION'&&p.tool==='abi_encode';
 check('ORIGINAL_PARAMETERS',profileTool||unsupported||!originalError,originalError??'Original ABI encoding valid');
 // Out-of-range / mistyped mutations are impossible ABI inputs unless this is an explicit ABI_TOOL_TEST.
 check('MUTATED_PARAMETERS',profileTool||unsupported||!mutationError||abiToolTest,mutationError?`Impossible ABI input (${mutationError}); use ABI_TOOL_TEST only for encoder conformance, never as contract/mempool failure`:'Mutation ABI encoding valid');
 check('ABI_TOOL_TEST_INTENT',!abiToolTest||!!mutationError,'ABI_TOOL_TEST requires a mutation the encoder actually rejects');
 const admission=['PUBLIC_ADMISSION','ALTERNATIVE_ADMISSION','VALIDATOR_AUTHORIZATION','EXECUTION_ACTION'].includes(p.domain);
 // Profile historical/context tools may list stake/deployment as semantic dimensions without requiring a fresh live chain check.
 check('RUNTIME_CONTEXT',profileTool||(!admission&&!p.preconditions.some(x=>['FUNDING','NONCE','STAKE','DEPLOYMENT','SIGNATURE_SCOPE','FRAME_LAYOUT','CHAIN_CLIENT'].includes(x))),'Missing verified sender/payer/frame/signature/chain/state prerequisites','CONDITIONAL');
 const modeOk=(p.domain==='ABI_ENCODING'&&p.tool==='abi_encode'&&!mutationError)||(abiToolTest)||(p.domain==='SOURCE_STRUCTURE'&&p.tool==='structure_check')||(p.domain==='POLICY_PREDICTION'&&['historical_evidence','uniswap_context','gas_policy'].includes(p.tool));
 check('MODE',modeOk,'Match domain to a supported local tool: encodable ABI_ENCODING, explicit ABI_TOOL_TEST, structure_check, or profile policy prediction — never invent EVM/admission execution','UNSUPPORTED');
 const failed=checks.filter(c=>!c.passed),decision=failed.some(c=>c.decision==='INVALID')?'INVALID':failed.some(c=>c.decision==='DUPLICATE')?'DUPLICATE':failed.some(c=>c.decision==='CONDITIONAL')?'CONDITIONAL':failed.length?'UNSUPPORTED':'EXECUTABLE';
 return {decision,checks,reason:failed.map(c=>c.id+': '+c.reason).join('; ')||'Compiler/ABI and local-mode gates passed',prerequisitesVerified:decision==='EXECUTABLE'};
}
export function typedDescriptor(proposal,analysis){
 if(checkProposal(proposal,analysis).decision!=='EXECUTABLE')throw Error('DETERMINISTIC_EXECUTION_VETO');
 const descriptor={schema:'framefuzz.byoc-test.v1',analysisId:analysis.analysisId,sourceDigest:analysis.sourceDigest,compiler:analysis.compiler,abiDigest:analysis.abiDigest,contractName:analysis.contractName,proposal:structuredClone(proposal)};
 descriptor.digest=digest(descriptor);
 return descriptor;
}
export function executeProposal(proposal,analysis){
 const descriptor=typedDescriptor(proposal,analysis);
 let observedVerdict=null,actual;
 if(proposal.tool==='abi_encode'){
  const originalCalldata=encodeInputs(analysis,proposal.functionSignature,proposal.originalArgs);let mutatedCalldata=null,error=null;
  try{mutatedCalldata=encodeInputs(analysis,proposal.functionSignature,proposal.mutatedArgs);observedVerdict='ACCEPT';}catch(e){error=e.message;observedVerdict='REJECT';}
  actual={originalCalldata,mutatedCalldata,error,meaning:proposal.domain==='ABI_TOOL_TEST'?'ABI encoder conformance only; not contract execution or admission':'ABI encoding of encodable values only; no contract function executed'};
 }else if(proposal.tool==='historical_evidence'||proposal.tool==='uniswap_context'){
  const profile=analysis.profile??{};actual={profileId:profile.id??null,summary:profile.summary??null,evidence:profile.historicalEvidence??null,context:profile.uniswapContext??null,meaning:'Pinned profile/context or historical capture; not a fresh chain observation'};observedVerdict=proposal.expectedVerdict==='UNKNOWN'?null:proposal.expectedVerdict;
 }else{
  const fn=analysis.structure?.functions?.find(f=>f.name===analysis.functions.find(f=>f.signature===proposal.functionSignature)?.name);
  actual={functionSource:fn??null,guardSyntax:(analysis.structure?.guards??[]).filter(g=>fn&&g.startLine>=fn.startLine&&g.endLine<=fn.endLine),externalCallSites:(analysis.structure?.externalCalls??[]).filter(g=>fn&&g.startLine>=fn.startLine&&g.endLine<=fn.endLine),meaning:'Syntactic AST facts only; no path or behavior proof'};
 }
 const executionMode=proposal.tool==='abi_encode'?'OFFLINE_ABI_ENCODING':proposal.domain==='POLICY_PREDICTION'?'POLICY_PREDICTION':'STATIC_AST';
 const outcome=classifyOutcome({expectedVerdict:proposal.expectedVerdict,observedVerdict,executionMode,provenance:proposal.tool==='historical_evidence'?'HISTORICAL_LIVE_CAPTURE':'LOCAL_SOLC_ABI_AND_VIEM',prerequisitesVerified:true});
 return {schema:'framefuzz.byoc-tool-result.v1',descriptor,outcome:{...outcome,outcomeDomain:proposal.domain,evmExecuted:false,admissionVerified:false},actual,sourceDigest:analysis.sourceDigest,broadcasts:0};
}
export function readTool(id,input,analysis){
 boundedJSON(input,4096);keys(input,['startLine','endLine','functionSignature']);
 if(id==='inspect_source'){
  const {startLine,endLine}=input;if(!Number.isSafeInteger(startLine)||!Number.isSafeInteger(endLine)||startLine<1||endLine<startLine||endLine-startLine>=20)throw Error('SOURCE_RANGE_LIMIT');
  const lines=analysis.source.split(/\r?\n/);if(endLine>lines.length)throw Error('SOURCE_RANGE_OUT_OF_BOUNDS');const text=lines.slice(startLine-1,endLine).join('\n');if(Buffer.byteLength(text)>2000)throw Error('SOURCE_RANGE_SIZE');return {schema:'framefuzz.source-range.v1',sourceDigest:analysis.sourceDigest,file:'UserInput.sol',startLine,endLine,text,untrusted:true};
 }
 if(id==='query_abi')return {schema:'framefuzz.abi-facts.v1',sourceDigest:analysis.sourceDigest,functions:(analysis.functions??[]).filter(f=>!input.functionSignature||f.signature===input.functionSignature)};
 if(id==='capabilities')return {schema:'framefuzz.tool-capabilities.v1',tools:TOOLS.filter(t=>!(analysis.profile?.id!=='uniswap-v4-paymaster'&&['historical_evidence','uniswap_context'].includes(t.id))),missingPrerequisites:analysis.missingPrerequisites};
 if(id==='historical_evidence'){
  if(!analysis.profile?.historicalEvidence)throw Error('HISTORICAL_EVIDENCE_UNAVAILABLE');
  return {schema:'framefuzz.historical-evidence.v1',untrusted:false,...analysis.profile.historicalEvidence,notice:'Historical live admission only; not a fresh EIP-8141 result'};
 }
 if(id==='uniswap_context'){
  if(!analysis.profile?.uniswapContext)throw Error('UNISWAP_CONTEXT_UNAVAILABLE');
  return {schema:'framefuzz.uniswap-context.v1',...analysis.profile.uniswapContext,notice:'StateView.getSlot0 is a real Uniswap v4 pool-state read during paymaster verification; FrameFuzz does not execute a swap or USDC reimbursement'};
 }
 throw Error('TOOL_NOT_PERMITTED');
}
export async function replayDescriptor(descriptor,input,options={}){
 const {digest:expected,...body}=descriptor;if(digest(body)!==expected||descriptor.schema!=='framefuzz.byoc-test.v1')throw Error('REPLAY_DIGEST_MISMATCH');
 const {analyzeContract}=await import('./compile.mjs');const analysis=await analyzeContract(input,options);
 if(analysis.analysisId!==descriptor.analysisId||analysis.sourceDigest!==descriptor.sourceDigest||analysis.abiDigest!==descriptor.abiDigest||analysis.compiler!==descriptor.compiler)throw Error('STALE_SOURCE_OR_COMPILER');
 return executeProposal(descriptor.proposal,analysis);
}
