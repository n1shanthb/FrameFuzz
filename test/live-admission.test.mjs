import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {keccak256} from 'viem';
import {analyzeContract} from '../src/playground/compile.mjs';
import {liveAdmissionReadiness,runLiveComparison} from '../src/playground/live-admission.mjs';
import {buildWalletTransaction,signWalletCandidate} from '../src/adapters/wallet-codec.mjs';
import {comparePolicyCandidate} from '../src/policy-comparison.mjs';

const SOURCE=readFileSync(new URL('../examples/contracts/StorageAccessValidator.sol',import.meta.url),'utf8');

test('pasted StorageAccessValidator compiles, detects SENDER_VALIDATOR, and emits source-bound runtime bytecode',async()=>{
  const a=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
  assert.equal(a.status,'READY',JSON.stringify(a.diagnostics?.slice(0,2)));
  assert.equal(a.detectedRole.role,'SENDER_VALIDATOR');
  assert.ok(a.runtimeBytecodeHash?.startsWith('0x'));
  assert.ok(a.capabilities.includes('LIVE_STORAGE_ACCESS_ADMISSION'));
  assert.ok(a.contracts.includes('Foreign'));
});

test('wallet candidate keeps identical raw/wire identity for both admission methods',async()=>{
  const key=generatePrivateKey(),owner=privateKeyToAccount(key).address,wallet='0x'+'11'.repeat(20);
  const c=await signWalletCandidate({privateKey:key,wallet,owner,nonce:0,sourceDigest:'ab'.repeat(32),analysisId:'cd'.repeat(32)});
  assert.equal(c.requests.public.method,'eth_sendRawTransaction');
  assert.equal(c.requests.alternative.method,'eth_sendFrameTransaction');
  assert.equal(c.requests.public.params[0],c.raw);
  assert.deepEqual(c.requests.alternative.params[0],c.wire);
  assert.equal(keccak256(c.raw),c.hash);
  assert.equal(c.broadcasts,0);
  const unsigned=buildWalletTransaction({wallet,owner,nonce:0,verifyData:'0x01'});
  assert.equal(unsigned.frames[0].data,'0x01');
});

test('live readiness blocks when wallet bytecode is missing and never invents divergence',async()=>{
  const a=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
  const r=await liveAdmissionReadiness(a,{wallet:null});
  assert.equal(r.capability,'STORAGE_ACCESS_VALIDATOR_V1');
  assert.equal(r.writes,0);
  assert.notEqual(r.classification,'READY_FOR_LIVE_COMPARISON');
  assert.ok(r.blockers.some(b=>/Deploy Foreign|Provide the deployed/i.test(b)));
});

test('rejection-first protocol still refuses parallel race and requires policy rejection before alt',async()=>{
  const key=generatePrivateKey(),owner=privateKeyToAccount(key).address,wallet='0x'+'22'.repeat(20);
  const candidate=await signWalletCandidate({privateKey:key,wallet,owner,nonce:3});
  let alt=0;
  const accepted=await comparePolicyCandidate({
    candidate,
    submitCanonical:async()=>candidate.hash,
    submitAlternative:async()=>{alt++;return candidate.hash;},
    readState:async()=>({pendingNonce:'3'}),
    readCanonicalReceipt:async()=>null,
    readAlternativeReport:async()=>null,
  });
  assert.equal(alt,0);
  assert.equal(accepted.divergence,'NONE');
  await assert.rejects(()=>runLiveComparison({candidate,authorizeWrites:false}),/authorizeWrites/);
});

test('ordinary QuotaVault source stays UNKNOWN and lacks live admission capability',async()=>{
  const q=readFileSync(new URL('../examples/contracts/QuotaVault.sol',import.meta.url),'utf8');
  const a=await analyzeContract({source:q,contractName:'QuotaVault'});
  assert.equal(a.detectedRole.role,'UNKNOWN');
  assert.equal(a.capabilities?.includes('LIVE_STORAGE_ACCESS_ADMISSION'),false);
});
