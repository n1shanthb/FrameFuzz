import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {getContractAddress} from 'viem';
import {prepareSponsoredPlan,SPONSORED_PROFILE} from '../src/swarm/sponsored-plan.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const investigation=JSON.parse(await readFile(new URL('../evidence/investigator/2026-11-06/sonnet-retry-2.json',import.meta.url)));
const config=JSON.parse(await readFile(new URL('../examples/live/devnet.json',import.meta.url)));
const minimal={chainId:1337,profile:SPONSORED_PROFILE};
const context={...minimal,deployer:'0x'+'1'.repeat(40),owner:'0x'+'2'.repeat(40),deploymentNonce:'7',payer:config.paymasters.basic};
test('sponsored offline plan is deterministic, derives CREATE addresses and preserves actual mutation',async()=>{
  const a=await prepareSponsoredPlan({investigation,context}),b=await prepareSponsoredPlan({investigation,context});assert.deepEqual(a,b);
  assert.equal(a.preparationComplete,true);assert.equal(a.liveReady,false);assert.equal(a.signaturesGenerated,0);assert.equal(a.deployments.length,5);
  assert.equal(a.deployments[0].predictedAddress,getContractAddress({from:context.deployer,nonce:7n}));
  assert.deepEqual(a.deployments[1].constructorArguments,[context.owner,a.deployments[0].predictedAddress,context.payer]);
  assert.ok(a.deployments.every(d=>/^0x[\da-f]{64}$/.test(d.initCodeHash)));assert.deepEqual(a.mutationValues,{operation:2,parameter:10});
  assert.ok(a.submissions.every(s=>s.nonceSeq===null&&s.sender!==s.payer));assert.equal(a.feeBounds.totalWei,'64000000000000000');
  const projection={schema:a.schema,path:a.path,roles:a.deployments.map(d=>d.role),nonces:a.deployments.map(d=>d.nonce),actionFrame:a.submissions[0].frameModes,fees:a.feeBounds.totalWei};
  assert.deepEqual(projection,{schema:'framefuzz.sponsored-preparation.v1',path:'SPONSORED_THREE_FRAME',roles:['action','unsafe_authorized','unsafe_tampered','safe_authorized','safe_tampered'],nonces:['7','8','9','10','11'],actionFrame:[1,1,2],fees:'64000000000000000'});
});
test('missing inputs stay unresolved rather than fabricating readiness or signatures',async()=>{
  const a=await prepareSponsoredPlan({investigation,context:minimal});assert.equal(a.preparationComplete,false);assert.deepEqual(a.missingInputs,['deployer','deploymentNonce','owner','payer']);assert.ok(a.deployments.every(d=>d.predictedAddress===null));
});
test('sponsored plan rejects contradictory inputs, wrong profile and write capabilities',async()=>{
  for(const patch of [{chainId:1},{profile:'self-funded-v1'},{payer:'0x'+'9'.repeat(40)},{deploymentNonce:'-1'},{owner:'0x'+'0'.repeat(40)},{privateKey:'never-accepted'}])await assert.rejects(prepareSponsoredPlan({investigation,context:{...context,...patch}}));
  await assert.rejects(prepareSponsoredPlan({investigation,context:{...minimal,deployer:context.deployer}}),/together/);
  await assert.rejects(prepareSponsoredPlan({investigation,context,submit:true}),/Unsupported/);
});
