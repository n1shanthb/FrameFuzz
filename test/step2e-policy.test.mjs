import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {keccak256} from 'viem';
import {decodeTx} from '@forshtat/hegota-support/tx';
import {profile} from '../src/adapters/workshop-codec.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const candidate=JSON.parse(await readFile('evidence/prepared/2026-11-07/step2e-policy-candidate.json','utf8'));
const artifact=JSON.parse(await readFile('artifacts/step2e/ReserveReadingPaymaster.json','utf8'));
const source=await readFile('vendor/paymaster/ReserveReadingPaymaster.sol');
const setup=JSON.parse(await readFile('evidence/prepared/2026-11-07/step2e-setup-signed.json','utf8'));

test('prepared policy candidate is bound to exact compiled source, runtime and predicted payer',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),candidate.source.sha256);
 assert.equal(candidate.source.sha256,artifact.sourceSha256);assert.equal(candidate.source.compiler,artifact.compiler);
 assert.equal(keccak256(candidate.raw),candidate.hash);
 const tx=decodeTx(profile,candidate.raw);
 assert.equal(tx.sender.toLowerCase(),candidate.sender.toLowerCase());assert.equal(String(tx.nonceSeq),candidate.nonce);
 assert.equal(tx.frames[1].mode,1);assert.equal(tx.frames[1].target.toLowerCase(),candidate.payer.toLowerCase());assert.equal(tx.frames[1].data,'0x01');
 assert.equal(candidate.bindings.expectedPaymasterRuntimeHash,candidate.source.expectedRuntimeHash);
});

test('prepared policy request preserves one identity across corrected endpoint shapes',()=>{
 assert.equal(candidate.requests.canonical.endpoint,EF_CANONICAL_ENDPOINT);assert.equal(candidate.requests.canonical.method,'eth_sendRawTransaction');assert.equal(candidate.requests.canonical.params[0],candidate.raw);
 assert.equal(candidate.requests.alternative.endpoint,EF_ALTERNATIVE_ENDPOINT);assert.equal(candidate.requests.alternative.method,'eth_sendFrameTransaction');assert.deepEqual(candidate.requests.alternative.params[0],candidate.wire);
 assert.equal(candidate.predictions.canonical.status,'REJECTED_POLICY');assert.equal(candidate.predictions.alternative.status,'ACCEPTED');assert.equal(candidate.broadcasts,0);
});

test('offline setup signatures bind deterministic deployment and stake without leaking a key',()=>{
 assert.equal(keccak256(setup.deployment.raw),setup.deployment.hash);assert.equal(setup.deployment.nonce,2);
 assert.equal(setup.predictedContract.toLowerCase(),candidate.payer.toLowerCase());assert.equal(setup.deployment.expectedRuntimeHash,candidate.bindings.expectedPaymasterRuntimeHash);
 const stake=decodeTx(profile,setup.stake.raw);assert.equal(keccak256(setup.stake.raw),setup.stake.hash);assert.equal(stake.sender.toLowerCase(),candidate.payer.toLowerCase());assert.equal(String(stake.nonceSeq),'0');assert.equal(stake.frames[0].data,'0x02');
 assert.equal(JSON.stringify(setup).includes('FRAMEFUZZ_SENDER_KEY'),false);assert.equal(setup.broadcasts,0);
});
