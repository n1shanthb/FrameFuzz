import {createHash} from 'node:crypto';
import {generateMutations,digest,GENERATOR_VERSION} from '../mutations/generator.mjs';
import {REGISTRY_SCHEMA} from './schema.mjs';
import {keccak256} from 'viem';

const ADDRESS=/^0x[\da-f]{40}$/i,HASH=/^0x[\da-f]{64}$/i,SHA=/^[\da-f]{64}$/;
const tag=(value)=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(value)&&!/0x[\da-f]{64}/i.test(value);
const assert=(condition,message)=>{if(!condition)throw new Error(`Invalid regression case: ${message}`);};
export function stableJSON(value){if(Array.isArray(value))return `[${value.map(stableJSON).join(',')}]`;if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableJSON(value[k])}`).join(',')}}`;return JSON.stringify(value);}
export const sha256=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:stableJSON(value)).digest('hex');
export function contentDigest(record){const {contentDigest:ignored,...body}=record;return sha256(body);}
const commit=value=>typeof value==='string'&&/^[\da-f]{40}$/i.test(value)?value:null;
const keys=(object,names)=>{assert(object&&typeof object==='object'&&!Array.isArray(object),'expected object');assert(Object.keys(object).every(k=>names.includes(k)),`unsupported field (${Object.keys(object).filter(k=>!names.includes(k)).join(', ')})`);};
const number=value=>{assert(Number.isSafeInteger(value)&&value>=0&&value<=1000000000,'numeric bound');return value;};

// Reconstruct a constrained, portable definition. No local paths, RPC URLs,
// executable references, raw calldata, signatures, credentials or trusted claims.
export function portableDefinition(input){
  assert(input&&['verification-gas','uniswap-storage'].includes(input.suite),'suite');
  const r=input.ruleModel??{},p=r.provenance??{},g=r.gas??{};
  assert(tag(r.version)&&tag(input.baseTemplate?.id),'model/base version');
  const storage={};
  for(const id of ['public','alt']){const s=r.storage?.[id];assert(s&&typeof s.staked==='boolean'&&typeof s.unstaked==='boolean','storage policy');assert(['StorageReadNonSender','unstaked payer accessed'].includes(s.rejection),'rejection rule');storage[id]={unstaked:s.unstaked,staked:s.staked,rejection:s.rejection};}
  const gas={};for(const field of ['maxTotal','senderExecution','signatureCost','observedPayerUsed','knownSufficientPayer'])gas[field]=number(g[field]);
  const definition={version:GENERATOR_VERSION,suite:input.suite,seed:number(input.seed),count:number(input.count),
    ruleModel:{version:r.version,chainId:1337,provenance:{confidence:'UNKNOWN',meaning:'Untrusted community fixture; original confidence is a publisher claim, not local verification',evidence:[],
      executionCommit:commit(p.executionCommit),sidecarVersion:tag(p.sidecarVersion)?p.sidecarVersion:'unknown',deployedSidecarCommit:commit(p.deployedSidecarCommit),reviewedSidecarCommit:commit(p.reviewedSidecarCommit)},gas,storage},
    baseTemplate:{id:input.baseTemplate.id,model:{verificationGasLimit:number(input.baseTemplate.model?.verificationGasLimit),poolRead:input.baseTemplate.model?.poolRead},
      setup:{staked:input.baseTemplate.setup?.staked,poolRead:input.baseTemplate.setup?.poolRead,configuration:{kind:input.baseTemplate.setup?.configuration?.kind}}},
    operation:input.suite==='verification-gas'?{type:'set-field',field:'verificationGasLimit',distances:input.operation?.distances?.map(number),radius:number(input.operation?.radius)}:{type:'storage-and-stake'},
    paths:input.paths};
  assert(definition.count>=1&&definition.count<=64,'community count limit is 64');
  if(input.suite==='verification-gas'){assert(input.operation?.type==='set-field'&&input.operation.field==='verificationGasLimit','semantic gas operation');assert(definition.operation.radius<=256,'community radius limit is 256');}
  else assert(input.operation?.type==='storage-and-stake','storage operation');
  generateMutations(definition); // existing semantic validation, with no signing/network.
  return definition;
}

function outcome(path){
  assert(path&&['accepted','rejected','inconclusive','transport_failure'].includes(path.observed?.status),'original admission state');
  const expected=path.oracle?.expected??path.expected??null;
  assert(['accepted','rejected',null].includes(expected),'expected admission');
  const verdict=path.comparison?.verdict??'INCONCLUSIVE';assert(tag(verdict),'verdict');
  const state=path.receipt?.state??'not_checked';assert(tag(state),'receipt state');
  const quantity=value=>typeof value==='string'&&/^0x[\da-f]{1,32}$/i.test(value)?value:null;
  const raw=path.replay?.signedRaw;
  const derived=typeof raw==='string'&&/^0x06(?:[\da-f]{2})+$/i.test(raw)?keccak256(raw):null;
  return {expected,confidence:['VERIFIED','INFERRED','UNKNOWN'].includes(path.oracle?.confidence)?path.oracle.confidence:'UNKNOWN',admission:path.observed.status,verdict,
    returnedHash:derived&&path.observed.hash?.toLowerCase()===derived.toLowerCase()?derived:null,computedHash:derived,
    receipt:{state,status:quantity(path.receipt?.status),blockNumber:quantity(path.receipt?.blockNumber)}};
}

/** @returns {import('./types.js').RegressionCase} */
export function buildRegressionCase({report,caseIndex=0,publisher,expiresAtBlock,expirationBlocks,evidenceDigest}){
  assert(ADDRESS.test(publisher),'publisher wallet');assert(/^[1-9]\d*$/.test(String(expiresAtBlock)),'expiry block');
  assert(Number.isSafeInteger(expirationBlocks)&&expirationBlocks>=30&&expirationBlocks<=1296000,'expiration must be 30 blocks to 30 days');
  const source=report.source??'',classification=source==='LIVE_RPC_SUBMISSION'?'LIVE':source.includes('MOCK')?'MOCK':source.startsWith('PREVIEW')?'PREVIEW':null;
  assert(classification,'source classification');
  const original=report.results?.[caseIndex],descriptor=original?.reproduction;assert(descriptor?.schema==='framefuzz.mutation-reproduction.v1','generated semantic case required');
  const definition=portableDefinition(descriptor.definition),variant=generateMutations(definition)[descriptor.variantIndex];assert(variant,'variant index');
  assert(stableJSON(variant.unsignedModel)===stableJSON(descriptor.unsignedModel)&&stableJSON(variant.setup)===stableJSON(descriptor.setup),'original semantic inputs do not regenerate');
  const p=descriptor.definition.ruleModel.provenance??{},ruleId=original.paths?.[0]?.oracle?.ruleId;assert(['MAX_VERIFY_GAS','STORAGE_ACCESS'].includes(ruleId),'target rule');
  const record={schemaVersion:REGISTRY_SCHEMA,caseVersion:1,suite:definition.suite,mutationFamily:definition.suite,ruleId,implementationVersion:definition.ruleModel.version,
    targetNetwork:{chainId:1337,executionCommit:commit(p.executionCommit),sidecarVersion:tag(p.sidecarVersion)?p.sidecarVersion:'unknown',sidecarCommit:commit(p.deployedSidecarCommit)},
    seed:definition.seed,semanticParameters:variant.parameter,
    originalOutcomes:Object.fromEntries(['public','alt'].map(id=>[id,outcome(original.paths.find(x=>x.id===id))])),
    reproduction:{schema:'framefuzz.mutation-reproduction.v1',generatorVersion:GENERATOR_VERSION,definition,definitionDigest:digest(definition),variantIndex:variant.index,baseTemplateId:variant.baseTemplateId,unsignedModel:variant.unsignedModel,setup:variant.setup},
    evidence:{classification,sha256:evidenceDigest??sha256(report),scope:'offchain-full-evidence',caseId:variant.id},publisher,
    expiration:{blocks:expirationBlocks,expiresAtBlock:String(expiresAtBlock)}};
  record.contentDigest=contentDigest(record);validateRegressionCase(record);return record;
}

export function validateRegressionCase(record){
  assert(Buffer.byteLength(JSON.stringify(record))<=32768,'payload exceeds 32 KiB');
  keys(record,['schemaVersion','caseVersion','suite','mutationFamily','ruleId','implementationVersion','targetNetwork','seed','semanticParameters','originalOutcomes','reproduction','evidence','publisher','expiration','contentDigest']);
  assert(record.schemaVersion===REGISTRY_SCHEMA&&record.caseVersion===1,'unsupported schema/case version');
  assert(ADDRESS.test(record.publisher)&&SHA.test(record.contentDigest)&&contentDigest(record)===record.contentDigest,'publisher/content digest');
  keys(record.targetNetwork,['chainId','executionCommit','sidecarVersion','sidecarCommit']);assert(record.targetNetwork.chainId===1337,'target network must be EIP-8141 devnet, never Arkiv');
  assert(tag(record.targetNetwork.sidecarVersion)&&(record.targetNetwork.executionCommit===null||commit(record.targetNetwork.executionCommit))&&(record.targetNetwork.sidecarCommit===null||commit(record.targetNetwork.sidecarCommit)),'client/source version');
  keys(record.expiration,['blocks','expiresAtBlock']);assert(Number.isSafeInteger(record.expiration.blocks)&&record.expiration.blocks>=30&&record.expiration.blocks<=1296000&&/^[1-9]\d*$/.test(record.expiration.expiresAtBlock),'expiration');
  keys(record.evidence,['classification','sha256','scope','caseId']);assert(['LIVE','PREVIEW','MOCK'].includes(record.evidence.classification)&&SHA.test(record.evidence.sha256)&&record.evidence.scope==='offchain-full-evidence'&&tag(record.evidence.caseId),'evidence classification/digest');
  keys(record.reproduction,['schema','generatorVersion','definition','definitionDigest','variantIndex','baseTemplateId','unsignedModel','setup']);
  const reproduction=record.reproduction;assert(reproduction.schema==='framefuzz.mutation-reproduction.v1'&&reproduction.generatorVersion===GENERATOR_VERSION,'reproduction version');
  const definition=portableDefinition(reproduction.definition);assert(stableJSON(definition)===stableJSON(reproduction.definition),'untrusted definition has unsupported fields, paths or trusted provenance');
  assert(digest(reproduction.definition)===reproduction.definitionDigest,'definition digest');
  const variant=generateMutations(reproduction.definition)[reproduction.variantIndex];assert(variant&&stableJSON(variant.unsignedModel)===stableJSON(reproduction.unsignedModel)&&stableJSON(variant.setup)===stableJSON(reproduction.setup)&&variant.baseTemplateId===reproduction.baseTemplateId,'semantic replay mismatch');
  assert(record.suite===definition.suite&&record.mutationFamily===definition.suite&&record.implementationVersion===definition.ruleModel.version&&record.seed===definition.seed&&stableJSON(record.semanticParameters)===stableJSON(variant.parameter),'metadata/semantic mismatch');
  assert(record.ruleId===(record.suite==='verification-gas'?'MAX_VERIFY_GAS':'STORAGE_ACCESS'),'rule ID must match suite');
  keys(record.originalOutcomes,['public','alt']);
  for(const id of ['public','alt']){
    const o=record.originalOutcomes[id];keys(o,['expected','confidence','admission','verdict','returnedHash','computedHash','receipt']);
    assert(['accepted','rejected',null].includes(o.expected)&&['VERIFIED','INFERRED','UNKNOWN'].includes(o.confidence)&&['accepted','rejected','inconclusive','transport_failure'].includes(o.admission)&&tag(o.verdict),'original outcome');
    assert((o.returnedHash===null||HASH.test(o.returnedHash))&&(o.computedHash===null||HASH.test(o.computedHash)),'transaction hash');
    keys(o.receipt,['state','status','blockNumber']);assert(tag(o.receipt.state),'receipt state');
    for(const field of ['status','blockNumber'])assert(o.receipt[field]===null||/^0x[\da-f]{1,32}$/i.test(o.receipt[field]),'receipt quantity');
  }
  return record;
}
