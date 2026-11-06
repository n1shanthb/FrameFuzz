import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {compareClientVector,prepareLiveProof} from '../src/swarm/readiness.mjs';
import {frameDigest} from '../src/mutations/frames.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const load=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const investigation=await load('evidence/investigator/2026-11-06/sonnet-retry-2.json');
const preflight=await load('evidence/swarm/phase-3/preflight.json');
const secondHead=await load('evidence/swarm/phase-3/head-second.json');
const prepare=extra=>prepareLiveProof({investigation,preflight,secondHead,...extra});
test('advertised ethrex golden bytes and hash agree with pinned workshop codec while EIP length behavior differs',async()=>{
 const c=await compareClientVector();assert(c.byteRoundtrip);assert(c.sourceVectorMatches);assert.equal(c.workshopCommitsToWitnessLength,false);assert.equal(c.currentEipCommitsToWitnessLength,true);assert.equal(c.runtimeCompatibility,'UNVERIFIED');
});
test('readiness consumes actual Sonnet-selected values and preserves isolated contexts without signing',async()=>{
 const p=await prepare();assert.deepEqual(p.model.mutationValues,{operation:2,parameter:10});assert.equal(p.plan.deploymentCount,5);assert.equal(p.plan.submissionCount,4);
 for(const s of p.plan.submissions){assert.deepEqual(s.submittedAction,s.role.endsWith('tampered')?{operation:2,parameter:10}:{operation:1,parameter:10});assert(!('raw' in s));assert(!('signature' in s));}
 const other=await prepare({variant:0});assert.deepEqual(other.model.mutationValues,{operation:1,parameter:20});assert.notEqual(other.plan.submissions[1].data,p.plan.submissions[1].data);
 assert.equal(p.liveTransactionsSent,0);assert.equal(p.broadcastCapability,false);assert.equal(p.plan.totalFeeUpperBoundWei,'64000000000000000');assert.equal(p.manifestReady,false);
});
test('readiness rejects simulated reports, descriptor tampering and inconsistent model values',async()=>{
 await assert.rejects(prepare({investigation:{...investigation,source:'SWARM_SIMULATED'}}),/real model/);
 const altered=structuredClone(investigation);altered.experiments[1].hypothesis.operation=9;await assert.rejects(prepare({investigation:altered}),/actual model/);
 const corrupt=structuredClone(investigation);corrupt.experiments[1].execution.descriptor.compilerInputDigest='wrong';await assert.rejects(prepare({investigation:corrupt}),/integrity/);
 const forged=structuredClone(corrupt),d=forged.experiments[1].execution.descriptor;const {contentDigest,...body}=d;d.contentDigest=frameDigest(body);await assert.rejects(prepare({investigation:forged}),/provenance/);
});
test('readiness rejects wrong chain, write flags and unrecognized signer capabilities',async()=>{
 await assert.rejects(prepare({preflight:{...preflight,chainId:1}}),/chain1337/);
 for(const flag of ['deploy','submit','publish'])await assert.rejects(prepare({[flag]:true}),/human approval/);
 await assert.rejects(prepare({signer:()=>assert.fail('must not run')}),/Unknown/);
});
test('head comparison requires later independent observations and does not imply write health',async()=>{
 assert.equal((await prepare()).headAdvancing,'YES');
 assert.equal((await prepare({secondHead:{...secondHead,observedAt:preflight.generatedAt}})).headAdvancing,'UNKNOWN');
 assert.equal((await prepare({secondHead:{...secondHead,block:{...secondHead.block,number:preflight.latestBlock.number}}})).headAdvancing,'NO');
 assert.equal((await prepare()).technicallyReadyForApproval,false);
});
test('missing sponsor and wallet produce explicit unresolved addresses and fee exclusions',async()=>{
 const p=await prepare();assert.equal(p.sponsorReady,false);assert.equal(p.fundedDeployerConfigured,false);assert(p.plan.deployments.every(d=>d.predictedAddress===null));assert(p.plan.deployments.slice(1).every(d=>d.initCodeHash===null));assert.match(p.plan.feeScope,/excludes sponsor/);assert.equal(p.compatibility.runtimeCompatibility,'UNVERIFIED');
});
