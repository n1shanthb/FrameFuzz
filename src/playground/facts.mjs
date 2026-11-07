import {toFunctionSignature,keccak256} from 'viem';
import {digest,sha256} from '../analysis/model.mjs';
export function extractFacts(input,output,compiler){
 const sourceDigest=sha256(input.source),diagnostics=(output.errors??[]).slice(0,30).map(e=>({severity:e.severity,code:e.errorCode??null,message:e.message.slice(0,1500),location:e.sourceLocation??null}));
 const base={schema:'framefuzz.contract-analysis.v1',sourceDigest,compiler,file:'UserInput.sol',diagnostics,source:input.source,declaredRole:input.role??'UNKNOWN',evmExecuted:false};
 if(diagnostics.some(e=>e.severity==='error'))return {...base,status:'COMPILE_ERROR',missingPrerequisites:['RESOLVE_COMPILER_DIAGNOSTICS'],capabilities:[]};
 const ast=output.sources?.['UserInput.sol']?.ast,compiled=output.contracts?.['UserInput.sol']??{},contracts=Object.values(compiled),definitions=ast?.nodes?.filter(n=>n.nodeType==='ContractDefinition')??[],names=definitions.map(n=>n.name);
 if(!definitions.length||!contracts.length)return {...base,status:'COMPILE_ERROR',missingPrerequisites:['CONCRETE_CONTRACT_REQUIRED'],capabilities:[],contracts:names};
 if(!input.contractName&&names.length>1)return {...base,status:'SELECT_CONTRACT',contracts:names,capabilities:[],missingPrerequisites:['SELECT_CONTRACT']};
 const selected=definitions.find(n=>n.name===(input.contractName??names[0]));
 if(!selected)return {...base,status:'SELECT_CONTRACT',contracts:names,capabilities:[],missingPrerequisites:['SELECT_EXISTING_CONTRACT']};
 const artifact=compiled[selected.name],abi=artifact.abi;
 if(abi.length>128)throw Error('ABI_OUTPUT_LIMIT');
 const creationBytecode=artifact.evm?.bytecode?.object?('0x'+artifact.evm.bytecode.object):null;
 const runtimeBytecode=artifact.evm?.deployedBytecode?.object?('0x'+artifact.evm.deployedBytecode.object):null;
 const immutableReferences=artifact.evm?.deployedBytecode?.immutableReferences??null;
 const creationBytecodeHash=creationBytecode&&creationBytecode!=='0x'?keccak256(creationBytecode):null;
 const runtimeBytecodeHash=runtimeBytecode&&runtimeBytecode!=='0x'?keccak256(runtimeBytecode):null;
 const param=p=>({type:p.type,...(p.components?{components:p.components.map(param)}:{})});
 const abiIdentity=a=>digest(a.map(x=>({type:x.type,name:x.name??'',inputs:(x.inputs??[]).map(param),outputs:(x.outputs??[]).map(param),stateMutability:x.stateMutability??'',anonymous:x.anonymous??false})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 if(input.abi&&abiIdentity(input.abi)!==abiIdentity(abi))return {...base,status:'ABI_MISMATCH',contracts:names,abi,capabilities:[],missingPrerequisites:['SUPPLIED_ABI_MUST_MATCH_COMPILER_OUTPUT']};
 const bytes=Buffer.from(input.source),facts=[],functions=[],variables=[],events=[],externalCalls=[],guards=[];let nodes=0;
 const ref=node=>{const [start,length]=node.src.split(':').map(Number),prefix=bytes.subarray(0,start).toString('utf8'),text=bytes.subarray(start,start+length).toString('utf8');return {id:'ast-'+node.id,file:'UserInput.sol',startLine:prefix.split('\n').length,endLine:(prefix+text).split('\n').length,sourceDigest,excerpt:text.slice(0,600)};};
 const walk=node=>{if(!node||typeof node!=='object')return;if(++nodes>30000)throw Error('AST_NODE_LIMIT');
  if(node.nodeType){
   if(node.nodeType==='FunctionDefinition'){
    const fact={...ref(node),kind:'function',name:node.kind==='function'?node.name:node.kind,visibility:node.visibility,stateMutability:node.stateMutability,modifiers:(node.modifiers??[]).map(m=>m.modifierName.name??m.modifierName.namePath??'unknown')};functions.push(fact);facts.push(fact);
   }
   if(node.nodeType==='VariableDeclaration'&&node.stateVariable){const fact={...ref(node),kind:'state-variable',name:node.name,type:node.typeDescriptions.typeString,visibility:node.visibility};variables.push(fact);facts.push(fact);}
   if(node.nodeType==='EventDefinition'){const fact={...ref(node),kind:'event',name:node.name};events.push(fact);facts.push(fact);}
   if(node.nodeType==='FunctionCall'){
    const name=node.expression?.name??node.expression?.memberName;
    if(['require','assert','revert'].includes(name)){const fact={...ref(node),kind:'guard-call',name};guards.push(fact);facts.push(fact);}
    if(node.expression?.nodeType==='MemberAccess'&&(/external/.test(node.expression.typeDescriptions?.typeString??'')||['call','delegatecall','staticcall','send','transfer'].includes(name))){const fact={...ref(node),kind:'external-call-site',name};externalCalls.push(fact);facts.push(fact);}
   }
  }
  for(const value of Object.values(node))if(value&&typeof value==='object'){if(Array.isArray(value))value.forEach(walk);else walk(value);}
 };
 // Include inherited nodes in the same submitted file; no dependency fetching.
 const ids=new Set(selected.linearizedBaseContracts??[selected.id]);definitions.filter(n=>ids.has(n.id)).forEach(walk);
 const callable=abi.filter(a=>a.type==='function').map(a=>({signature:toFunctionSignature(a),name:a.name,inputs:a.inputs,outputs:a.outputs,stateMutability:a.stateMutability}));
 if(callable.length>48||facts.length>256)throw Error('FACT_OUTPUT_LIMIT');
 const analysisId=digest({sourceDigest,compiler,selected:selected.name,abi:abiIdentity(abi),role:base.declaredRole,runtimeBytecodeHash});
 const storageAccess=/FOREIGN\.staticcall|ViolatingWallet|StorageReadNonSender/i.test(input.source)&&/approve\s*\(\s*Scope\.EXECUTION_AND_PAYMENT\s*\)/.test(input.source)&&/HegotaSupport/.test(input.source);
 const paymasterLike=/PAYMASTER|approve\s*\(\s*Scope\.PAYMENT\s*\)|ReserveReadingPaymaster/i.test(input.source)&&/HegotaSupport/.test(input.source);
 const detectedRole=storageAccess?{role:'SENDER_VALIDATOR',basis:'Source matches the supported storage-access ViolatingWallet interface (FOREIGN.staticcall during VERIFY + HegotaSupport approve).'}
  :paymasterLike?{role:'PAYMASTER',basis:'Source matches a HegotaSupport payment-approval pattern.'}
  :base.declaredRole==='SENDER_VALIDATOR'||base.declaredRole==='PAYMASTER'?{role:base.declaredRole,basis:'Declared role accepted; structural EIP-8141 binding still requires deployment and live frames.'}
  :{role:'UNKNOWN',basis:'Compiler exposes callable structure; ordinary source does not establish an EIP-8141 role'};
 const liveCapable=detectedRole.role==='SENDER_VALIDATOR'&&Boolean(runtimeBytecodeHash);
 return {...base,status:'READY',analysisId,contractName:selected.name,contractKind:selected.contractKind,abstract:selected.abstract,contracts:names,abi,abiDigest:abiIdentity(abi),functions:callable,sourceFacts:facts,structure:{functions,variables,events,guards,externalCalls},
  creationBytecode,runtimeBytecode,immutableReferences,creationBytecodeHash,runtimeBytecodeHash,
  detectedRole,
  capabilities:liveCapable
   ?['COMPILER_ABI','TYPED_ABI_ENCODING','STRUCTURAL_SOURCE_CHECK','STATIC_FEASIBILITY','SOURCE_BOUND_BYTECODE','LIVE_STORAGE_ACCESS_ADMISSION']
   :['COMPILER_ABI','TYPED_ABI_ENCODING','STRUCTURAL_SOURCE_CHECK','STATIC_FEASIBILITY'],
  missingPrerequisites:liveCapable
   ?['DEPLOY_FOREIGN_AND_WALLET','STAKE_WALLET_GT_MINSTAKE','FUNDED_OWNER_SIGNER','OPERATOR_LIVE_AUTHORIZATION']
   :['NO_GENERIC_EVM_EXECUTOR','EIP8141_SENDER_PAYER_FRAME_SIGNATURE_CONTEXT','DEPLOYED_CHAIN_CLIENT_NONCE_FUNDING_STAKE_STATE'],
  limitations:['AST call sites and guard syntax are not reachability or security proofs',
   liveCapable?'Live comparison supports only this storage-access validator interface, not arbitrary pasted Solidity':'No bytecode execution, deployment, EVM gas measurement or observed admission',
   'HegotaSupport imports are resolved only from the local @forshtat/hegota-support package; source remains untrusted data']};
}
