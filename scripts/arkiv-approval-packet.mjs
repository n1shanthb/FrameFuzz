#!/usr/bin/env node
/** Build intent/envelope approval packet + legacy manifest diff. No broadcast. */
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {
  buildImmutableIntent,
  buildExecutionEnvelope,
  evaluateApprovalGate,
  diffManifests,
  legacyCanonicalManifest,
  legacyManifestDigest,
} from '../src/arkiv/approval-gate.mjs';
import {stringify} from '../src/arkiv/cli.mjs';

const WRITER='0x20370BE5BA867Ab4779ad0686963A55ADc0722b1';
const CONTENT='0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25';
const SOURCE='evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json';
const EXPIRES='345303';
const PROPOSED_MAX_FEE='0.001';

const shared={
  writer:WRITER,
  sourceReport:SOURCE,
  sourceSchema:'framefuzz.evidence.v1',
  caseIndex:0,
  expirationBlocks:43200,
  expiresAtBlock:EXPIRES,
  contentDigest:CONTENT,
  suite:'verification-gas',
  ruleId:'MAX_VERIFY_GAS',
  nonce:0,
  balanceWei:'10000000000000000000',
};

const oldManifest=legacyCanonicalManifest({
  ...shared,
  gasPriceWei:'1000000000',
  estimatedFeeWei:'314427000000000',
  maximumFeeWei:'628854000000000',
});
const newManifest=legacyCanonicalManifest({
  ...shared,
  gasPriceWei:'1014938300',
  estimatedFeeWei:String(314427n*1014938300n),
  maximumFeeWei:String(314427n*2n*1014938300n),
});

const oldDigest=legacyManifestDigest(oldManifest);
const newDigest=legacyManifestDigest(newManifest);
const diff=diffManifests(oldManifest,newManifest);

const intent=buildImmutableIntent({
  writer:WRITER,
  contentDigest:CONTENT,
  sourceReport:SOURCE,
  caseIndex:0,
  suite:'verification-gas',
  ruleId:'MAX_VERIFY_GAS',
  expirationBlocks:43200,
  expiresAtBlock:EXPIRES,
});

const envelopeAtOldGas=buildExecutionEnvelope({
  maxFeeEther:PROPOSED_MAX_FEE,
  gasPriceWei:'1000000000',
  estimatedGasUsed:314427n,
  gasSafetyFactor:2n,
  nonce:0,
  balanceWei:shared.balanceWei,
  currentBlock:'302103',
});
const envelopeAtNewGas=buildExecutionEnvelope({
  maxFeeEther:PROPOSED_MAX_FEE,
  gasPriceWei:'1014938300',
  estimatedGasUsed:314427n,
  gasSafetyFactor:2n,
  nonce:0,
  balanceWei:shared.balanceWei,
  currentBlock:'302273',
});

const gateAtNewGas=evaluateApprovalGate({
  approvedIntent:intent,
  approvedMaxFeeEther:PROPOSED_MAX_FEE,
  expectedNonce:0,
  live:{
    chainId:7794095,
    writer:WRITER,
    nonce:0,
    balanceWei:shared.balanceWei,
    gasPriceWei:'1014938300',
    currentBlock:'302273',
  },
  rebuilt:{
    chainId:7794095,
    writer:WRITER,
    contentDigest:CONTENT,
    sourceReport:SOURCE,
    caseIndex:0,
    suite:'verification-gas',
    ruleId:'MAX_VERIFY_GAS',
    expirationBlocks:43200,
    expiresAtBlock:EXPIRES,
  },
  duplicate:false,
});

const packet={
  schema:'framefuzz.arkiv-approval-packet.v2',
  status:'AWAITING_EXPLICIT_USER_APPROVAL',
  submit:false,
  broadcast:false,
  preparedAt:new Date().toISOString(),
  policy:{
    bind:'immutable_intent_digest',
    fee:'dynamic_within_explicit_ceiling',
    publications:1,
    ceilingAutoIncrease:false,
    uncertainBroadcast:'reconcile_do_not_retry',
  },
  immutableIntent:intent,
  executionEnvelope:{
    approvedMaxFeeEther:PROPOSED_MAX_FEE,
    approvedMaxFeeWei:envelopeAtNewGas.maxFeeWei,
    observedAtOldGas:envelopeAtOldGas,
    observedAtRepricedGas:envelopeAtNewGas,
    headroomVsRepricedMax:{
      projectedMaximumFeeEther:envelopeAtNewGas.projectedMaximumFeeEther,
      approvedCeilingEther:PROPOSED_MAX_FEE,
      remainingHeadroomEther:String(Number(PROPOSED_MAX_FEE)-Number(envelopeAtNewGas.projectedMaximumFeeEther)),
    },
  },
  gateSimulation:gateAtNewGas,
  legacyManifestAnalysis:{
    oldDigest,
    newDigest,
    expectedOld:'dcbbf2d37d29ad00ec2eae17636377f1139ada061ba3b805cb9916cc5c6fbf89',
    expectedNew:'781a0087dfb8f2e2eb4d302dc8926d66c440d92c245e785dfcbbcc43724edd5f',
    digestsMatchExpected:oldDigest==='dcbbf2d37d29ad00ec2eae17636377f1139ada061ba3b805cb9916cc5c6fbf89'
      &&newDigest==='781a0087dfb8f2e2eb4d302dc8926d66c440d92c245e785dfcbbcc43724edd5f',
    diff,
    conclusion:'SHA256 changed only because volatile gasPrice/fee estimate fields moved (~+1.49%). Immutable intent fields were identical.',
  },
  approvalPrompt:{
    text:'Approve ONE Arkiv createEntity under immutable intentDigest below with max fee ceiling 0.001 tGLM. Gas may move only while projected max fee ≤ 0.001. Intent/payload/writer/chain/destination changes require fresh approval.',
    intentDigest:intent.intentDigest,
    maxFeeEther:PROPOSED_MAX_FEE,
    contentDigest:CONTENT,
    writer:WRITER,
    chainId:7794095,
  },
};

await mkdir('runs/arkiv-approved',{recursive:true});
await writeFile('runs/arkiv-approved/manifest-diff.json',stringify({
  oldDigest,
  newDigest,
  oldManifest,
  newManifest,
  diff,
})+'\n');
await writeFile('runs/arkiv-approved/approval-packet-v2.json',stringify(packet)+'\n');

// Also refresh the human-facing ready packet under the new schema.
await writeFile('runs/stage-b-arkiv-approval-packet-v2.json',stringify(packet)+'\n');

console.log(stringify({
  status:'PACKET_READY_NO_BROADCAST',
  intentDigest:intent.intentDigest,
  proposedMaxFeeEther:PROPOSED_MAX_FEE,
  gateStatus:gateAtNewGas.status,
  legacy:{oldDigest,newDigest,intentChanges:diff.intentChanges.length,volatileChanges:diff.volatileChanges.map(c=>c.field)},
  outputs:['runs/arkiv-approved/manifest-diff.json','runs/arkiv-approved/approval-packet-v2.json','runs/stage-b-arkiv-approval-packet-v2.json'],
}));
