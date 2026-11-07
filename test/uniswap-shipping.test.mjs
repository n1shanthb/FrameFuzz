import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadCapturedUniswapEvidence,uniswapSource,UNISWAP_SOURCE_SHA256,UNISWAP_PAYMASTER,UNISWAP_RUNTIME_HASH} from '../src/playground/uniswap-live.mjs';

test('captured Uniswap evidence projects verified dual-path identity and 3/3 execution',async()=>{
 const evidence=await loadCapturedUniswapEvidence();
 assert.equal(evidence.provenance,'CAPTURED_LIVE_EVIDENCE');
 assert.equal(evidence.chainId,1337);
 assert.equal(evidence.transactionIdentity,'0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067');
 assert.equal(evidence.canonical.status,'REJECTED_POLICY');
 assert.equal(evidence.canonical.rule,'StorageReadNonSender');
 assert.equal(evidence.alternative.status,'ACCEPTED_AND_INCLUDED');
 assert.equal(evidence.alternative.admissionId,2065);
 assert.deepEqual(evidence.frameSummary,{successful:3,total:3});
 assert.equal(evidence.inclusion.receipt.status,'0x1');
 assert.equal(evidence.source.sha256,UNISWAP_SOURCE_SHA256);
 assert.equal(evidence.bindings.paymaster.toLowerCase(),UNISWAP_PAYMASTER.toLowerCase());
 assert.equal(evidence.source.expectedRuntimeHash,UNISWAP_RUNTIME_HASH);
});

test('supported Uniswap editor source is exact and retains getSlot0 PAYMENT path',async()=>{
 const source=await uniswapSource();
 assert.equal(createHash('sha256').update(source).digest('hex'),UNISWAP_SOURCE_SHA256);
 assert.match(source,/getSlot0\(POOL_ID\)/);
 assert.match(source,/Scope\.PAYMENT/);
});
