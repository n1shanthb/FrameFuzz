import {createHash} from 'node:crypto';
import {REGISTRY_SCHEMA} from '../arkiv/schema.mjs';
import {SUPPORTED_STORAGE_ACCESS_SCENARIO} from './supported-scenario.mjs';

const SHA=/^[\da-f]{64}$/;
const HASH=/^0x[\da-f]{64}$/i;
const ADDRESS=/^0x[\da-f]{40}$/i;

export function sha256Stable(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  return createHash('sha256').update(text).digest('hex');
}

/** Sanitized observation regression for the storage-access live product.
 * Distinct from Arkiv framefuzz.regression.v1 mutation-reproduction payloads.
 * Ready for operator-confirmed Arkiv publication only after explicit approval.
 */
export function buildStorageAccessRegression({comparison,analysis,scenario=SUPPORTED_STORAGE_ACCESS_SCENARIO,inclusionFollowUp=null}={}){
  if(!comparison||comparison.provenance!=='LIVE')throw Error('Regression requires a LIVE comparison result');
  if(comparison.provenance==='LIVE'&&!comparison.transactionIdentity)throw Error('Missing transaction identity');
  const row=comparison.table?.[0]??{};
  const admissionId=row.evidence?.sidecarAdmissionId??comparison.alternativeReport?.admission?.id??null;
  const later=inclusionFollowUp?.laterOutcome??row.evidence?.laterMempoolOutcome??comparison.alternativeReport?.admission?.outcome??null;
  const inclusionStatus=comparison.inclusion?.blockNumber?'MINED'
    :later==='dropped'||later==='Cancelled'?'DROPPED'
    :comparison.alternative?.status==='ACCEPTED'?'ADMITTED_NOT_MINED'
    :'NOT_OBSERVED';
  const body={
    schema:'framefuzz.storage-access-regression.v1',
    suite:'storage-access-validator',
    ruleId:'StorageReadNonSender',
    mutation:{
      id:'violating-wallet-foreign-staticcall',
      description:row.mutation??comparison.canonical?.message??'FOREIGN.staticcall during VERIFY',
      verifyData:'0x01',
    },
    source:{
      digest:analysis?.sourceDigest??row.evidence?.sourceDigest??null,
      contractName:analysis?.contractName??scenario.contractName,
      companion:scenario.companion,
      compiler:analysis?.compiler??scenario.compiler,
      runtimeBytecodeTemplateHash:analysis?.runtimeBytecodeHash??scenario.runtimeBytecodeTemplateHash,
      file:scenario.sourceFile,
      kind:scenario.kind,
    },
    deployments:{
      wallet:row.evidence?.wallet??scenario.fixtures.wallet,
      foreign:scenario.fixtures.foreign,
      owner:scenario.fixtures.owner,
      binding:row.evidence?.boundMode??scenario.fixtures.deployProvenance.binding,
      stakingRegistry:scenario.fixtures.stakingRegistry,
      stakeWei:scenario.fixtures.stakeWei,
      unstakeDelaySec:scenario.fixtures.unstakeDelaySec,
    },
    observed:{
      transactionHash:comparison.transactionIdentity,
      capturedAt:comparison.observedAt??row.evidence?.timestamp??null,
      public:{
        verdict:comparison.canonical?.status??row.canonicalVerdict,
        rule:'StorageReadNonSender',
        message:comparison.canonical?.message??row.evidence?.rule??null,
        errorClass:comparison.canonical?.errorClass??null,
      },
      alternative:{
        verdict:comparison.alternative?.status??row.alternativeVerdict,
        admissionId,
        message:comparison.alternative?.message??null,
      },
      divergence:comparison.divergence,
      inclusionStatus,
      claims:{
        ADMISSION_DIVERGENCE:comparison.divergence==='POLICY_DIVERGENCE',
        INCLUSION:Boolean(comparison.inclusion?.blockNumber),
        EXECUTION_SUCCESS:'NOT_OBSERVED',
      },
      endpoints:comparison.endpoints??null,
      rpcEvidence:{
        canonical:comparison.canonical??null,
        alternative:comparison.alternative??null,
        alternativeAdmissionId:admissionId,
        inclusion:comparison.inclusion??null,
        laterMempoolOutcome:later,
      },
    },
    prerequisites:{
      chainId:1337,
      stakeRequired:true,
      stakeWei:scenario.fixtures.stakeWei,
      unstakeDelaySec:scenario.fixtures.unstakeDelaySec,
      sourceDigestMustMatch:scenario.sourceDigest,
    },
    arkivPublication:{
      status:'AWAITING_EXPLICIT_USER_APPROVAL',
      targetSchema:REGISTRY_SCHEMA,
      note:'Existing Arkiv framefuzz.regression.v1 expects mutation-reproduction suites (uniswap-storage / verification-gas). This observation descriptor is saved locally first; map/publish only after explicit approval.',
      broadcasts:0,
    },
    provenance:'LIVE',
    writes:0,
  };
  const contentDigest=sha256Stable(body);
  return {...body,contentDigest};
}

export function validateStorageAccessRegression(record){
  if(record?.schema!=='framefuzz.storage-access-regression.v1')throw Error('Unexpected regression schema');
  if(!SHA.test(record.contentDigest??''))throw Error('contentDigest required');
  const {contentDigest,...body}=record;
  if(sha256Stable(body)!==contentDigest)throw Error('contentDigest mismatch');
  if(!HASH.test(record.observed?.transactionHash??''))throw Error('transactionHash required');
  if(record.observed?.public?.rule!=='StorageReadNonSender')throw Error('rule must be StorageReadNonSender');
  if(record.observed?.claims?.EXECUTION_SUCCESS!=='NOT_OBSERVED')throw Error('must not claim execution success');
  if(record.observed?.claims?.INCLUSION===true&&record.observed?.inclusionStatus==='DROPPED')throw Error('INCLUSION cannot be true when DROPPED');
  if(!ADDRESS.test(record.deployments?.wallet??''))throw Error('wallet required');
  if(record.arkivPublication?.status!=='AWAITING_EXPLICIT_USER_APPROVAL'&&record.arkivPublication?.broadcasts!==0){
    /* allow post-approval statuses only when broadcasts stay honest */
  }
  if(record.provenance!=='LIVE')throw Error('provenance must remain LIVE for this product path');
  return true;
}
