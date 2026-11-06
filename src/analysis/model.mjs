import {createHash} from 'node:crypto';
import {EVIDENCE_CLASSES} from '../evidence-status.mjs';
export const ROLES=['SENDER_VALIDATOR','PAYMASTER','EXECUTION_TARGET','EXTERNAL_POLICY_DEPENDENCY','UNKNOWN'];
export const CLASSIFICATIONS=EVIDENCE_CLASSES;
export const LIMITS=Object.freeze({sourceBytes:65536,abiBytes:32768,abiEntries:256,jsonBytes:262144,depth:16,nodes:12000,tests:7});
export class AnalysisError extends Error{constructor(code,message,prerequisites=[]){super(message);this.code=code;this.prerequisites=prerequisites;}}
export const fail=(ok,code,message)=>{if(!ok)throw new AnalysisError(code,message);};
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export function boundedJSON(value,maxBytes=LIMITS.jsonBytes){
 let nodes=0;const seen=new Set();
 function walk(v,depth){
  fail(++nodes<=LIMITS.nodes&&depth<=LIMITS.depth,'INPUT_LIMIT','Input nesting/node limit exceeded');
  if(v===null||typeof v==='boolean')return;
  if(typeof v==='number'){fail(Number.isFinite(v),'INVALID_JSON','Finite JSON numbers required');return;}
  if(typeof v==='string'){fail(Buffer.byteLength(v)<=LIMITS.sourceBytes,'INPUT_LIMIT','String size limit exceeded');return;}
  fail(v&&typeof v==='object'&&(Array.isArray(v)||Object.getPrototypeOf(v)===Object.prototype),'INVALID_JSON','Plain serializable JSON required');
  fail(!seen.has(v),'INVALID_JSON','Cyclic input rejected');seen.add(v);
  fail(Object.keys(v).length<=512,'INPUT_LIMIT','Object/array size limit exceeded');
  for(const [k,x]of Object.entries(v)){fail(!['__proto__','constructor','prototype'].includes(k)&&!/^(private[_-]?key|secret|password|token|mnemonic|authorization)$/i.test(k),'UNSAFE_METADATA','Credential/prototype fields are not accepted');walk(x,depth+1);}
  seen.delete(v);
 }
 walk(value,0);const text=JSON.stringify(value);fail(Buffer.byteLength(text)<=maxBytes,'INPUT_LIMIT','JSON byte limit exceeded');return value;
}
const ordered=v=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
export const digest=value=>sha256(JSON.stringify(ordered(boundedJSON(value))));
export const keys=(value,allowed)=>{fail(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_SCHEMA','Object required');fail(Object.keys(value).every(k=>allowed.includes(k)),'INVALID_SCHEMA','Unsupported fields');};
export const address=value=>typeof value==='string'&&/^0x[\da-f]{40}$/i.test(value)&&!/^0x0{40}$/i.test(value);
const uint=(v,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
function abiParameters(params,depth=0){
 fail(Array.isArray(params)&&params.length<=64&&depth<=8,'INVALID_ABI','Bounded ABI parameter array required');
 for(const p of params){keys(p,['name','type','internalType','components','indexed']);fail(typeof p.type==='string'&&/^[a-zA-Z0-9_\[\]]{1,80}$/.test(p.type),'INVALID_ABI','Invalid ABI parameter type');if(p.components)abiParameters(p.components,depth+1);if(p.name!==undefined)fail(typeof p.name==='string'&&/^[a-zA-Z0-9_]{0,100}$/.test(p.name),'INVALID_ABI','Invalid ABI parameter name');}
}
export function contractInput(value){
 boundedJSON(value);keys(value,['schema','kind','source','abi','deployment','compiler','role','provenance','contentDigest','sourceDigest','abiDigest']);
 fail(value.schema==='framefuzz.contract-input.v1','SCHEMA_VERSION','Unsupported ContractInput version');
 fail(['SOLIDITY_SOURCE','ABI','DEPLOYED'].includes(value.kind),'INVALID_SCHEMA','Unsupported input kind');
 const role=value.role??'UNKNOWN';fail(ROLES.includes(role),'INVALID_ROLE','Unsupported contract role');
 if(value.source){keys(value.source,['content','fileId']);fail(typeof value.source.content==='string'&&value.source.content.length>0&&Buffer.byteLength(value.source.content)<=LIMITS.sourceBytes,'INPUT_LIMIT','Solidity source must be1–65536 bytes');if(value.source.fileId!==undefined)fail(/^[\w-][\w./-]{0,100}\.sol$/.test(value.source.fileId)&&!value.source.fileId.includes('..'),'INVALID_SOURCE_ID','Source identifier is a label, never a filesystem path');}
 if(value.abi!==undefined){fail(Array.isArray(value.abi)&&value.abi.length<=LIMITS.abiEntries&&Buffer.byteLength(JSON.stringify(value.abi))<=LIMITS.abiBytes,'INPUT_LIMIT','ABI size limit exceeded');for(const entry of value.abi){keys(entry,['type','name','inputs','outputs','stateMutability','anonymous']);fail(['function','constructor','receive','fallback','event','error'].includes(entry.type),'INVALID_ABI','Unknown ABI entry');if(entry.inputs)abiParameters(entry.inputs);if(entry.outputs)abiParameters(entry.outputs);if(entry.name!==undefined)fail(typeof entry.name==='string'&&/^[A-Za-z_][\w]{0,99}$/.test(entry.name),'INVALID_ABI','Invalid ABI name');if(entry.stateMutability!==undefined)fail(['pure','view','payable','nonpayable'].includes(entry.stateMutability),'INVALID_ABI','Invalid ABI mutability');}}
 if(value.deployment){keys(value.deployment,['address','chainId']);fail(address(value.deployment.address)&&uint(value.deployment.chainId)&&value.deployment.chainId>0,'INVALID_DEPLOYMENT','Address and positive chain ID required; existence is unverified');}
 if(value.compiler){keys(value.compiler,['version','settings']);if(value.compiler.version!==undefined)fail(typeof value.compiler.version==='string'&&value.compiler.version.length<=80,'INVALID_COMPILER','Invalid compiler version');if(value.compiler.settings){keys(value.compiler.settings,['optimizer','evmVersion']);if(value.compiler.settings.optimizer){keys(value.compiler.settings.optimizer,['enabled','runs']);fail(typeof value.compiler.settings.optimizer.enabled==='boolean'&&uint(value.compiler.settings.optimizer.runs,1000000),'INVALID_COMPILER','Bounded optimizer settings required');}if(value.compiler.settings.evmVersion!==undefined)fail(/^[a-zA-Z0-9_-]{1,32}$/.test(value.compiler.settings.evmVersion),'INVALID_COMPILER','Invalid EVM version');}}
 if(value.provenance){keys(value.provenance,['origin','reference']);fail(['USER_SUPPLIED','REPOSITORY_REFERENCE'].includes(value.provenance.origin),'INVALID_PROVENANCE','Origin is a declaration, not attestation');if(value.provenance.reference!==undefined)fail(typeof value.provenance.reference==='string'&&value.provenance.reference.length<=200,'INVALID_PROVENANCE','Bounded reference required');}
 fail(value.kind==='SOLIDITY_SOURCE'?Boolean(value.source):value.kind==='ABI'?value.abi!==undefined:Boolean(value.deployment),'INVALID_SCHEMA','Input content missing for kind');
 const content={kind:value.kind,source:value.source?.content??null,abi:value.abi??null,deployment:value.deployment??null,compiler:value.compiler??null};
 const contentDigest=digest(content);if(value.contentDigest!==undefined)fail(value.contentDigest===contentDigest,'DIGEST_MISMATCH','Contract content digest mismatch');
 return {...structuredClone(value),role,provenance:value.provenance??{origin:'USER_SUPPLIED'},contentDigest,sourceDigest:value.source?sha256(value.source.content):null,abiDigest:value.abi?digest(value.abi):null};
}
export function analysisContext(value){
 boundedJSON(value,16384);keys(value,['schema','path','profile','clientCommit','chainId','endpointIdentity','frameLayout','sender','payer','executionTarget','nonceSeq','deployment','funding','staking','storageDependencies','verificationGas','evidenceRefs']);
 fail(value.schema==='framefuzz.analysis-context.v1','SCHEMA_VERSION','Unsupported AnalysisContext version');
 if(value.path!==undefined)fail(['public','alt'].includes(value.path),'INVALID_CONTEXT','Path must be public or alt');
 if(value.profile!==undefined)fail(typeof value.profile==='string'&&/^[\w.-]{1,100}$/.test(value.profile),'INVALID_CONTEXT','Invalid profile');
 if(value.clientCommit!==undefined)fail(/^[\da-f]{40}$/i.test(value.clientCommit),'INVALID_CONTEXT','Invalid client commit');
 if(value.chainId!==undefined)fail(uint(value.chainId)&&value.chainId>0,'INVALID_CONTEXT','Invalid chain ID');
 for(const k of ['sender','payer','executionTarget'])if(value[k]!==undefined)fail(address(value[k]),'INVALID_CONTEXT','Invalid '+k);
 if(value.nonceSeq!==undefined)fail(typeof value.nonceSeq==='string'&&/^(0|[1-9]\d{0,15})$/.test(value.nonceSeq),'INVALID_CONTEXT','Bounded decimal nonce required');
 if(value.endpointIdentity!==undefined){let url;try{url=new URL(value.endpointIdentity);}catch{}fail(url&&['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/','UNSAFE_ENDPOINT','Endpoint identity must be a credential-free origin; no requests will be made');}
 if(value.frameLayout){fail(Array.isArray(value.frameLayout)&&value.frameLayout.length<=8,'INVALID_CONTEXT','Bounded frame layout required');for(const f of value.frameLayout){keys(f,['mode','flags','target']);fail([1,2].includes(f.mode)&&uint(f.flags,3)&&(f.target===undefined||f.target===null||address(f.target)),'INVALID_CONTEXT','Unsupported frame shape');}}
 if(value.verificationGas){keys(value.verificationGas,['senderExecution','signatureCost','maxTotal']);fail(Object.values(value.verificationGas).every(v=>uint(v,10000000)),'INVALID_CONTEXT','Invalid gas quantities');}
 for(const field of ['deployment','funding','staking'])if(value[field]){keys(value[field],['status','detail']);fail(['UNKNOWN','ASSUMED'].includes(value[field].status)&&(!value[field].detail||(typeof value[field].detail==='string'&&value[field].detail.length<=300)),'INVALID_CONTEXT','Assumptions cannot assert verified runtime state');}
 for(const field of ['storageDependencies','evidenceRefs'])if(value[field]){fail(Array.isArray(value[field])&&value[field].length<=32&&value[field].every(x=>typeof x==='string'&&x.length<=200),'INVALID_CONTEXT','Bounded descriptive references required; never resolved as files/URLs');}
 return structuredClone(value);
}
export function normalizedResult(value){
 boundedJSON(value);fail(value.schema==='framefuzz.analysis-result.v1'&&CLASSIFICATIONS.includes(value.classification),'SCHEMA_VERSION','Invalid result version/classification');
 fail(value.execution?.broadcasts===0&&value.execution?.paidModelCalls===0&&value.execution?.userKeysUsed===false,'UNSAFE_EXECUTION','Foundation results cannot assert network writes or user-key use');
 fail(value.classification!=='CURRENT_LIVE','UNSUPPORTED_MODE','Current live observations are not supported by the foundation');
 if(['POLICY_PREDICTION','UNVERIFIED','SIMULATION'].includes(value.classification))fail(value.actual===null,'PROVENANCE_MISMATCH','Predictions/unverified inputs cannot carry observed results');
 if(value.classification==='OFFLINE_EXECUTED')fail(value.kind==='OFFLINE_CRYPTOGRAPHY'&&value.actual?.admission===undefined&&value.actual?.transactionHash===undefined&&value.actionEvidence?.verified===false,'PROVENANCE_MISMATCH','Offline cryptography is not admission or action execution');
 if(value.classification==='HISTORICAL_LIVE')fail(value.kind==='ADMISSION'&&value.provenance?.kind==='REPOSITORY_CAPTURE'&&value.provenance.references?.length>0&&value.actual?.paths?.length>0,'PROVENANCE_MISMATCH','Historical observations require captured paths and provenance');
 return structuredClone(value);
}
