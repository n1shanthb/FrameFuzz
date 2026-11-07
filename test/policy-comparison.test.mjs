import test from 'node:test';
import assert from 'node:assert/strict';
import {keccak256} from 'viem';
import {RpcResponseError} from '../src/rpc.mjs';
import {comparePolicyCandidate} from '../src/policy-comparison.mjs';

const raw='0x0600',hash=keccak256(raw),candidate={raw,wire:{chainId:'0x539'},hash,nonce:'7',sourceDigest:'a'.repeat(64),mutation:'StateView.getSlot0 during staked PAYMENT verification'};
const policy=()=>{throw new RpcResponseError(-32000,'validation-prefix simulation failed: StorageReadNonSender')};
const state=nonce=>async()=>({pendingNonce:String(nonce)});

test('policy divergence requires canonical policy rejection, unchanged state and real sidecar acceptance report',async()=>{
 const calls=[];
 const out=await comparePolicyCandidate({candidate,simulateCanonical:async()=>({canonicalMempoolValid:false}),submitCanonical:async()=>policy(),submitAlternative:async()=>{calls.push('alt');return hash},readState:state(7),readCanonicalReceipt:async()=>null,readAlternativeReport:async()=>({admission:{outcome:'accepted',checks:[{rule:'storage',verdict:'pass'}]}})});
 assert.deepEqual(calls,['alt']);assert.equal(out.simulation.status,'SIMULATION_ONLY');assert.equal(out.canonical.status,'REJECTED_POLICY');assert.equal(out.alternative.status,'ACCEPTED');assert.equal(out.divergence,'POLICY_DIVERGENCE');
});

test('canonical acceptance stops before alternative and cannot become divergence',async()=>{
 let alt=0;const out=await comparePolicyCandidate({candidate,submitCanonical:async()=>hash,submitAlternative:async()=>{alt++;return hash},readState:state(7),readCanonicalReceipt:async()=>null,readAlternativeReport:async()=>null});
 assert.equal(alt,0);assert.equal(out.canonical.status,'ACCEPTED');assert.equal(out.alternative.status,'NOT_TESTED');assert.equal(out.divergence,'NONE');
});

test('precondition rejection and post-rejection nonce race both block alternative',async()=>{
 let alt=0;
 const malformed=await comparePolicyCandidate({candidate,submitCanonical:async()=>{throw new RpcResponseError(-32602,'invalid signature')},submitAlternative:async()=>{alt++},readState:state(7),readCanonicalReceipt:async()=>null,readAlternativeReport:async()=>null});
 assert.equal(malformed.canonical.status,'REJECTED_PRECONDITION');assert.equal(alt,0);
 let reads=0;const race=await comparePolicyCandidate({candidate,submitCanonical:async()=>policy(),submitAlternative:async()=>{alt++},readState:async()=>({pendingNonce:String(reads++?8:7)}),readCanonicalReceipt:async()=>null,readAlternativeReport:async()=>null});
 assert.equal(race.alternative.status,'INCONCLUSIVE_SHARED_STATE_RACE');assert.equal(alt,0);
});

test('candidate hash and live nonce are non-overridable gates',async()=>{
 const hooks={submitCanonical:async()=>hash,submitAlternative:async()=>hash,readState:state(7),readCanonicalReceipt:async()=>null,readAlternativeReport:async()=>null};
 await assert.rejects(()=>comparePolicyCandidate({candidate:{...candidate,hash:'0x'+'0'.repeat(64)},...hooks}),/identity/);
 await assert.rejects(()=>comparePolicyCandidate({candidate,...hooks,readState:state(8)}),/nonce/);
});
