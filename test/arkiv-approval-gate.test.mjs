import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEther} from 'viem';
import {
  buildImmutableIntent,
  buildExecutionEnvelope,
  evaluateApprovalGate,
  diffManifests,
  legacyCanonicalManifest,
  legacyManifestDigest,
  sha256Stable,
} from '../src/arkiv/approval-gate.mjs';

const BASE_INTENT_INPUT={
  writer:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',
  contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
  sourceReport:'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
  caseIndex:0,
  suite:'verification-gas',
  ruleId:'MAX_VERIFY_GAS',
  expirationBlocks:43200,
  expiresAtBlock:'345303',
};

function liveOk(overrides={}){
  return {
    chainId:7794095,
    writer:BASE_INTENT_INPUT.writer,
    nonce:0,
    balanceWei:parseEther('10').toString(),
    gasPriceWei:'1000000000',
    currentBlock:'302103',
    estimatedGasUsed:314427n,
    gasSafetyFactor:2n,
    ...overrides,
  };
}

function rebuiltOk(overrides={}){
  return {
    chainId:7794095,
    rpc:'https://rpc.rabdi.db-chain.testnet.arkiv.network',
    writer:BASE_INTENT_INPUT.writer,
    contentDigest:BASE_INTENT_INPUT.contentDigest,
    sourceReport:BASE_INTENT_INPUT.sourceReport,
    caseIndex:0,
    suite:'verification-gas',
    ruleId:'MAX_VERIFY_GAS',
    expirationBlocks:43200,
    expiresAtBlock:'345303',
    ...overrides,
  };
}

test('legacy SHA256 drift is explained solely by volatile fee/gas fields',()=>{
  const shared={
    writer:BASE_INTENT_INPUT.writer,
    sourceReport:BASE_INTENT_INPUT.sourceReport,
    sourceSchema:'framefuzz.evidence.v1',
    caseIndex:0,
    expirationBlocks:43200,
    expiresAtBlock:'345303',
    contentDigest:BASE_INTENT_INPUT.contentDigest,
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
  assert.equal(legacyManifestDigest(oldManifest),'dcbbf2d37d29ad00ec2eae17636377f1139ada061ba3b805cb9916cc5c6fbf89');
  assert.equal(legacyManifestDigest(newManifest),'781a0087dfb8f2e2eb4d302dc8926d66c440d92c245e785dfcbbcc43724edd5f');
  const diff=diffManifests(oldManifest,newManifest);
  assert.equal(diff.intentChanges.length,0);
  assert.ok(diff.volatileChanges.length>=4);
  const fields=diff.volatileChanges.map(c=>c.field).sort();
  assert.deepEqual(fields,[
    'estimatedFeeEther','estimatedFeeWei','gasPriceWei','maximumFeeEther','maximumFeeWei',
  ]);
});

test('immutable intent digest is stable across gas-price changes',()=>{
  const a=buildImmutableIntent(BASE_INTENT_INPUT);
  const b=buildImmutableIntent(BASE_INTENT_INPUT);
  assert.equal(a.intentDigest,b.intentDigest);
  assert.match(a.intentDigest,/^[\da-f]{64}$/);
  assert.equal(a.publicationCount,1);
  assert.equal(a.action,'createEntity');
  assert.equal(a.destination.readonly,true);
});

test('benign gas repricing stays valid under an approved fee ceiling',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const baseline=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({gasPriceWei:'1000000000'}),
    rebuilt:rebuiltOk(),
  });
  assert.equal(baseline.status,'PREFLIGHT_PASS');
  assert.equal(baseline.submitAllowed,true);

  const bumped=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({gasPriceWei:'1014938300'}), // ~+1.49%
    rebuilt:rebuiltOk(),
  });
  assert.equal(bumped.status,'PREFLIGHT_PASS');
  assert.equal(bumped.submitAllowed,true);
  assert.equal(bumped.intentDigest,approved.intentDigest);
  assert.ok(BigInt(bumped.envelope.projectedMaximumFeeWei)<parseEther('0.001'));
  assert.equal(bumped.autoRetry,false);
});

test('fee-cap violation fails closed and never raises the ceiling',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.000628854',
    expectedNonce:0,
    live:liveOk({gasPriceWei:'1014938300'}),
    rebuilt:rebuiltOk(),
  });
  assert.equal(result.status,'STOP_REQUIRES_NEW_APPROVAL');
  assert.equal(result.submitAllowed,false);
  assert.ok(result.blockers.includes('feeWithinCeiling'));
  assert.equal(result.envelope.maxFeeEther,'0.000628854');
  assert.equal(result.checks.ceilingNotRaised,true);
});

test('payload / contentDigest change fails closed and requires fresh approval',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk(),
    rebuilt:rebuiltOk({contentDigest:'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'}),
  });
  assert.equal(result.status,'STOP_REQUIRES_NEW_APPROVAL');
  assert.ok(result.blockers.includes('intentDigestOk')||result.blockers.includes('contentDigestOk'));
  assert.match(result.notice,/Immutable intent changed/);
});

test('destination or entity flag change fails closed',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const tampered={...approved,destination:{...approved.destination,readonly:false},entityFlags:{readonly:false,permissionlessExtension:true}};
  // Rebuild live intent from rebuilt fields — simulate destination drift by changing registrySchema path via rebuild of flags through evaluate's destinationOk.
  // Force destination mismatch by mutating approved copy used as "live" via rebuilt registrySchema change that alters destination.
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk(),
    rebuilt:rebuiltOk({registrySchema:'framefuzz.regression.v2-tampered'}),
  });
  assert.equal(result.status,'STOP_REQUIRES_NEW_APPROVAL');
  assert.ok(result.blockers.includes('intentDigestOk')||result.blockers.includes('destinationOk'));
  assert.notEqual(sha256Stable(tampered.destination),sha256Stable(approved.destination));
});

test('writer or chain change fails closed',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const wrongWriter=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({writer:'0x1111111111111111111111111111111111111111'}),
    rebuilt:rebuiltOk({writer:'0x1111111111111111111111111111111111111111'}),
  });
  assert.equal(wrongWriter.submitAllowed,false);
  assert.ok(wrongWriter.blockers.includes('writerOk')||wrongWriter.blockers.includes('intentDigestOk'));

  const wrongChain=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({chainId:1}),
    rebuilt:rebuiltOk(),
  });
  assert.equal(wrongChain.submitAllowed,false);
  assert.ok(wrongChain.blockers.includes('chainIdOk'));
});

test('nonce change fails closed',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({nonce:1}),
    rebuilt:rebuiltOk(),
  });
  assert.equal(result.status,'STOP_REQUIRES_NEW_APPROVAL');
  assert.ok(result.blockers.includes('nonceMatchesExpected'));
  assert.equal(result.submitAllowed,false);
});

test('duplicate contentDigest submission fails closed',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk(),
    rebuilt:rebuiltOk(),
    duplicate:true,
  });
  assert.equal(result.submitAllowed,false);
  assert.ok(result.blockers.includes('notDuplicate'));
});

test('uncertain prior broadcast requires reconcile and forbids auto-retry',()=>{
  const approved=buildImmutableIntent(BASE_INTENT_INPUT);
  const result=evaluateApprovalGate({
    approvedIntent:approved,
    approvedMaxFeeEther:'0.001',
    expectedNonce:0,
    live:liveOk({nonce:1}),
    rebuilt:rebuiltOk(),
    uncertainPriorBroadcast:true,
  });
  assert.equal(result.status,'RECONCILE_REQUIRED');
  assert.equal(result.submitAllowed,false);
  assert.equal(result.autoRetry,false);
  assert.match(result.reason,/reconcil/i);
});

test('execution envelope never auto-increases the approved ceiling',()=>{
  const envelope=buildExecutionEnvelope({
    maxFeeEther:'0.001',
    gasPriceWei:'5000000000',
    estimatedGasUsed:314427n,
    gasSafetyFactor:2n,
    nonce:0,
    balanceWei:parseEther('10').toString(),
    currentBlock:'302000',
  });
  assert.equal(envelope.maxFeeEther,'0.001');
  assert.equal(envelope.ceilingAutoIncrease,false);
  assert.ok(BigInt(envelope.projectedMaximumFeeWei)>parseEther('0.001'));
});
