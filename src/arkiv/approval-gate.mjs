import {createHash} from 'node:crypto';
import {formatEther,parseEther} from 'viem';
import {ARKIV_CHAIN_ID,ARKIV_RPC} from './client.mjs';
import {REGISTRY_SCHEMA} from './schema.mjs';

const ADDRESS=/^0x[\da-f]{40}$/i;
const SHA=/^[\da-f]{64}$/;
const DIGEST_HEX=/^[\da-f]{64}$/;

/** Stable JSON for digests — sorted object keys, arrays preserved. */
export function stableJSON(value){
  if(Array.isArray(value))return `[${value.map(stableJSON).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableJSON(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const sha256Stable=value=>createHash('sha256').update(stableJSON(value)).digest('hex');

/** Fields that belong in the immutable transaction intent (payload + destination + identity). */
export const INTENT_FIELDS=Object.freeze([
  'schema','operation','action','chainId','rpc','writer','registrySchema',
  'sourceReport','caseIndex','suite','ruleId','contentDigest',
  'expirationBlocks','expiresAtBlock','publicationCount',
  'entityFlags','destination',
]);

/** Observational / fee fields that may move without changing intent. */
export const VOLATILE_FIELDS=Object.freeze([
  'gasPriceWei','estimatedFeeWei','estimatedFeeEther','maximumFeeWei','maximumFeeEther',
  'balanceWei','balanceEther','nonce','preparedAt','at','currentBlock','buildError','notice',
  'status','submit','classification','manifestDigest','maximumFeeEtherObserved',
]);

/**
 * Build the immutable intent object. Digested separately from live fee/nonce observations.
 * Changing any field here requires a fresh human approval.
 */
export function buildImmutableIntent({
  chainId=ARKIV_CHAIN_ID,
  rpc=ARKIV_RPC,
  writer,
  contentDigest,
  sourceReport,
  caseIndex=0,
  suite,
  ruleId,
  expirationBlocks=43200,
  expiresAtBlock,
  publicationCount=1,
  registrySchema=REGISTRY_SCHEMA,
}={}){
  if(chainId!==ARKIV_CHAIN_ID)throw new Error('Arkiv intent chainId must be Rabdi 7794095');
  if(rpc!==ARKIV_RPC)throw new Error('Arkiv intent RPC must be the Rabdi endpoint');
  if(!ADDRESS.test(writer??''))throw new Error('Arkiv intent writer must be a checksummable address');
  if(!SHA.test(contentDigest??''))throw new Error('Arkiv intent contentDigest must be 64-hex');
  if(typeof sourceReport!=='string'||!sourceReport.length)throw new Error('Arkiv intent sourceReport required');
  if(!Number.isSafeInteger(caseIndex)||caseIndex<0)throw new Error('Arkiv intent caseIndex invalid');
  if(typeof suite!=='string'||!suite||typeof ruleId!=='string'||!ruleId)throw new Error('Arkiv intent suite/ruleId required');
  if(!Number.isSafeInteger(expirationBlocks)||expirationBlocks<30||expirationBlocks>1296000)throw new Error('Arkiv intent expirationBlocks out of range');
  if(!/^[1-9]\d*$/.test(String(expiresAtBlock)))throw new Error('Arkiv intent expiresAtBlock required');
  if(publicationCount!==1)throw new Error('Arkiv intent permits exactly one publication');
  const intent={
    schema:'framefuzz.arkiv-publish-intent.v1',
    operation:'ARKIV_PUBLISH',
    action:'createEntity',
    chainId,
    rpc,
    writer,
    registrySchema,
    destination:{kind:'arkiv-entity',registrySchema,readonly:true,permissionlessExtension:false},
    entityFlags:{readonly:true,permissionlessExtension:false},
    sourceReport,
    caseIndex,
    suite,
    ruleId,
    contentDigest,
    expirationBlocks,
    expiresAtBlock:String(expiresAtBlock),
    publicationCount:1,
  };
  return {...intent,intentDigest:sha256Stable(intent)};
}

/**
 * Explicit fee ceiling + live observations. Ceiling is never raised automatically.
 */
export function buildExecutionEnvelope({
  maxFeeEther,
  gasPriceWei,
  estimatedGasUsed=314427n,
  gasSafetyFactor=2n,
  nonce,
  balanceWei,
  currentBlock,
}={}){
  if(typeof maxFeeEther!=='string'||!/^\d+(\.\d+)?$/.test(maxFeeEther))throw new Error('maxFeeEther must be a decimal string');
  const maxFeeWei=parseEther(maxFeeEther);
  if(maxFeeWei<=0n)throw new Error('maxFeeEther must be positive');
  const gasPrice=BigInt(gasPriceWei);
  const estimated=BigInt(estimatedGasUsed);
  const factor=BigInt(gasSafetyFactor);
  if(estimated<=0n||factor<=0n)throw new Error('gas estimate/factor must be positive');
  const estimatedFeeWei=estimated*gasPrice;
  const maximumFeeWei=estimated*factor*gasPrice;
  return {
    schema:'framefuzz.arkiv-execution-envelope.v1',
    maxFeeEther,
    maxFeeWei:maxFeeWei.toString(),
    gasPriceWei:gasPrice.toString(),
    estimatedGasUsed:estimated.toString(),
    gasSafetyFactor:factor.toString(),
    estimatedFeeWei:estimatedFeeWei.toString(),
    estimatedFeeEther:formatEther(estimatedFeeWei),
    projectedMaximumFeeWei:maximumFeeWei.toString(),
    projectedMaximumFeeEther:formatEther(maximumFeeWei),
    nonce:Number(nonce),
    balanceWei:String(balanceWei),
    balanceEther:formatEther(BigInt(balanceWei)),
    currentBlock:String(currentBlock),
    ceilingAutoIncrease:false,
    notice:'Gas may move within the approved maxFee ceiling only. Intent fields cannot change.',
  };
}

/** Field-by-field comparison of two plain objects. */
export function diffManifests(oldManifest,newManifest,{classify=true}={}){
  const keys=new Set([...Object.keys(oldManifest||{}),...Object.keys(newManifest||{})]);
  const changes=[];
  for(const key of [...keys].sort()){
    const before=oldManifest?.[key];
    const after=newManifest?.[key];
    const same=stableJSON(before)===stableJSON(after);
    if(same)continue;
    const bucket=VOLATILE_FIELDS.includes(key)?'volatile'
      :INTENT_FIELDS.includes(key)||key==='contentDigest'||key==='writer'||key==='chainId'?'intent'
      :'other';
    changes.push({field:key,before:before??null,after:after??null,classification:classify?bucket:undefined});
  }
  return {
    changed:changes.length>0,
    changeCount:changes.length,
    intentChanges:changes.filter(c=>c.classification==='intent'),
    volatileChanges:changes.filter(c=>c.classification==='volatile'),
    otherChanges:changes.filter(c=>c.classification==='other'),
    changes,
  };
}

/**
 * Evaluate whether a live observation may proceed under an approved intent + fee ceiling.
 * Fail-closed. Never raises the fee ceiling. Never auto-retries uncertain broadcasts.
 */
export function evaluateApprovalGate({
  approvedIntent,
  approvedMaxFeeEther,
  expectedNonce=0,
  live,
  rebuilt,
  duplicate=false,
  uncertainPriorBroadcast=false,
}={}){
  if(!approvedIntent?.intentDigest||!DIGEST_HEX.test(approvedIntent.intentDigest))throw new Error('approvedIntent.intentDigest required');
  if(typeof approvedMaxFeeEther!=='string')throw new Error('approvedMaxFeeEther required');

  const liveIntent=buildImmutableIntent({
    chainId:rebuilt.chainId??approvedIntent.chainId,
    rpc:rebuilt.rpc??approvedIntent.rpc,
    writer:rebuilt.writer??live.writer,
    contentDigest:rebuilt.contentDigest,
    sourceReport:rebuilt.sourceReport??approvedIntent.sourceReport,
    caseIndex:rebuilt.caseIndex??approvedIntent.caseIndex,
    suite:rebuilt.suite??approvedIntent.suite,
    ruleId:rebuilt.ruleId??approvedIntent.ruleId,
    expirationBlocks:rebuilt.expirationBlocks??approvedIntent.expirationBlocks,
    expiresAtBlock:rebuilt.expiresAtBlock??approvedIntent.expiresAtBlock,
    publicationCount:1,
    registrySchema:rebuilt.registrySchema??approvedIntent.registrySchema,
  });

  const envelope=buildExecutionEnvelope({
    maxFeeEther:approvedMaxFeeEther,
    gasPriceWei:live.gasPriceWei,
    estimatedGasUsed:live.estimatedGasUsed??314427n,
    gasSafetyFactor:live.gasSafetyFactor??2n,
    nonce:live.nonce,
    balanceWei:live.balanceWei,
    currentBlock:live.currentBlock,
  });

  const checks={
    intentDigestOk:liveIntent.intentDigest===approvedIntent.intentDigest,
    chainIdOk:Number(live.chainId)===ARKIV_CHAIN_ID&&Number(live.chainId)===approvedIntent.chainId,
    writerOk:String(live.writer).toLowerCase()===approvedIntent.writer.toLowerCase(),
    contentDigestOk:rebuilt.contentDigest===approvedIntent.contentDigest,
    destinationOk:stableJSON(liveIntent.destination)===stableJSON(approvedIntent.destination)
      &&stableJSON(liveIntent.entityFlags)===stableJSON(approvedIntent.entityFlags),
    expiryPolicyOk:liveIntent.expirationBlocks===approvedIntent.expirationBlocks
      &&liveIntent.expiresAtBlock===approvedIntent.expiresAtBlock,
    publicationCountOk:liveIntent.publicationCount===1,
    feeWithinCeiling:BigInt(envelope.projectedMaximumFeeWei)<=BigInt(envelope.maxFeeWei),
    balanceCoversCeiling:BigInt(live.balanceWei)>=BigInt(envelope.maxFeeWei),
    nonceMatchesExpected:Number(live.nonce)===Number(expectedNonce),
    expiryStillFuture:BigInt(live.currentBlock)<BigInt(approvedIntent.expiresAtBlock),
    notDuplicate:!duplicate,
    noUncertainBroadcast:!uncertainPriorBroadcast,
    ceilingNotRaised:true, // evaluate never mutates approvedMaxFeeEther
  };

  const blockers=Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
  if(uncertainPriorBroadcast){
    return {
      status:'RECONCILE_REQUIRED',
      submitAllowed:false,
      autoRetry:false,
      reason:'Uncertain prior broadcast — reconcile receipt/nonce before any new attempt',
      intentDigest:approvedIntent.intentDigest,
      liveIntentDigest:liveIntent.intentDigest,
      envelope,
      checks,
      blockers,
    };
  }
  if(blockers.length){
    return {
      status:'STOP_REQUIRES_NEW_APPROVAL',
      submitAllowed:false,
      autoRetry:false,
      intentDigest:approvedIntent.intentDigest,
      liveIntentDigest:liveIntent.intentDigest,
      envelope,
      checks,
      blockers,
      notice:blockers.includes('intentDigestOk')||blockers.includes('contentDigestOk')||blockers.includes('destinationOk')
        ?'Immutable intent changed — fresh approval required'
        :blockers.includes('feeWithinCeiling')
          ?'Projected max fee exceeds approved ceiling — raise ceiling only via fresh approval'
          :'Prerequisite failed closed',
    };
  }
  return {
    status:'PREFLIGHT_PASS',
    submitAllowed:true,
    autoRetry:false,
    intentDigest:approvedIntent.intentDigest,
    liveIntentDigest:liveIntent.intentDigest,
    envelope,
    checks,
    blockers:[],
    notice:'Intent bound; gas may move only while projected max fee ≤ approved ceiling',
  };
}

/** Convenience: reconstruct the v1 flat manifest used before intent/envelope split. */
export function legacyCanonicalManifest({
  writer,sourceReport,sourceSchema,caseIndex,expirationBlocks,expiresAtBlock,contentDigest,
  suite,ruleId,nonce,balanceWei,gasPriceWei,estimatedFeeWei,maximumFeeWei,buildError=null,
}={}){
  return {
    schema:'framefuzz.arkiv-publish-manifest.v1',
    status:'DRAFT_AWAITING_EXPLICIT_APPROVAL',
    submit:false,
    chainId:ARKIV_CHAIN_ID,
    rpc:ARKIV_RPC,
    operation:'ARKIV_PUBLISH',
    writer,
    sourceReport,
    sourceSchema:sourceSchema??null,
    caseIndex,
    expirationBlocks,
    expiresAtBlock:String(expiresAtBlock),
    contentDigest,
    suite,
    ruleId,
    nonce:Number(nonce),
    balanceWei:String(balanceWei),
    balanceEther:formatEther(BigInt(balanceWei)),
    gasPriceWei:String(gasPriceWei),
    estimatedFeeWei:String(estimatedFeeWei),
    maximumFeeWei:String(maximumFeeWei),
    estimatedFeeEther:formatEther(BigInt(estimatedFeeWei)),
    maximumFeeEther:formatEther(BigInt(maximumFeeWei)),
    buildError,
    notice:'Preview only. No broadcast until explicit approval of this exact digest.',
  };
}

export function legacyManifestDigest(manifest){
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}
