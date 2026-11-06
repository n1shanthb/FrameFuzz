import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {privateKeyToAccount,generatePrivateKey} from 'viem/accounts';import {recoverAddress,toFunctionSelector} from 'viem';
import {decodeTx} from '@forshtat/hegota-support/tx';import {profile} from '../src/adapters/workshop-codec.mjs';
import {compileOwnedFixtures} from '../src/swarm/compile.mjs';
import {unsignedSelfFundedTransaction,prepareSelfFundedPair,selfFundedFeeBound,SELF_FUNDED_CAP_WEI} from '../src/adapters/self-funded-validator.mjs';
import {classifySelfFundedExperiment} from '../src/swarm/self-funded-oracle.mjs';
import {prepareSelfFundedReadiness} from '../src/swarm/self-funded.mjs';
import {surveyDevnets,SURVEY_NETWORKS} from '../src/swarm/devnet-survey.mjs';
import {AUTHORIZED_SWARM_ENDPOINTS} from '../src/swarm/preflight.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const load=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const investigation=await load('evidence/investigator/2026-11-06/sonnet-retry-2.json');
const mutation=investigation.experiments[1].execution.descriptor.mutation;
const addr=n=>'0x'+n.toString(16).padStart(40,'0');
const ownerAccount=privateKeyToAccount(generatePrivateKey());
const params={sender:addr(101),target:addr(200),nonce:7,mutation,ownerAccount};
test('isolated self-funded contracts compile without changing original sponsored source digest',async()=>{
 const old=await compileOwnedFixtures(),fresh=await compileOwnedFixtures({variant:'self-funded-v1'});
 assert.equal(old.inputDigest,'2c014bf67354663c1bcad20c7d6d9122840868abe8950314beee25c87cdb9d70');
 assert.notEqual(fresh.inputDigest,old.inputDigest);
 for(const name of ['SenderValidatorUnsafeSelfFunded','SenderValidatorSafeSelfFunded']){
  const artifact=fresh.artifacts[name];assert(artifact.bytecode.length>1000);assert(artifact.abi.some(x=>x.type==='receive'&&x.stateMutability==='payable'));assert(artifact.abi.some(x=>x.name==='FeeCapExceeded'));assert.equal(artifact.abi.find(x=>x.type==='constructor').inputs.length,2);
 }
});
test('self-funded wire encodes scope3, sender target, marker and action frame1 with retained ARBITRARY authorization',async()=>{
 for(const fixture of ['unsafe','safe']){
  const p=await prepareSelfFundedPair({...params,fixture}),tx=decodeTx(profile,p.authorized.raw);
  assert.equal(p.payer,p.sender);assert.equal(p.actionFrameIndex,1);assert.equal(tx.frames.length,2);assert.equal(tx.frames[0].mode,1);assert.equal(tx.frames[0].flags,3);assert.equal(tx.frames[0].target,null);assert.equal(tx.frames[0].data,'0x01');assert.equal(tx.frames[1].data,mutation.authorized.data);
  assert.equal(p.tampered.transaction.frames[1].data,mutation.tampered.data);assert(p.invariants.sameWitness);assert(p.invariants.sameTarget);assert(p.invariants.canonicalHashChanged);assert(p.invariants.authorizedOwnerRecovered);assert.equal(p.invariants.tamperedOwnerRecovered,fixture==='unsafe');
  assert.equal(tx.signatures[0].scheme,0);assert.equal(tx.signatures[0].msg,'0x');assert.equal(tx.signatures[0].signature.length,132);assert.equal(p.broadcasts,0);
 }
});
test('original authorization cannot cross a fresh unsafe sender context or nonce',async()=>{
 const a=await prepareSelfFundedPair({...params,fixture:'unsafe'});
 for(const change of [{sender:addr(102)},{nonce:8}]){
  const b=await prepareSelfFundedPair({...params,...change,fixture:'unsafe'});
  const recovered=await recoverAddress({hash:b.ownerDigest,signature:a.authorized.transaction.signatures[0].signature});assert.notEqual(recovered.toLowerCase(),ownerAccount.address.toLowerCase());
 }
});
test('sender fee bound includes wire data and rejects raised limits, blobs, sponsored layouts and fee overrides',()=>{
 const input={sender:params.sender,target:params.target,nonce:7,data:mutation.tampered.data};
 const tx=unsignedSelfFundedTransaction(input),bound=selfFundedFeeBound(tx);
 assert(BigInt(bound.gasUpperBound)<500000n);assert(BigInt(bound.derivedMaxFeeUpperBoundWei)<=SELF_FUNDED_CAP_WEI);assert.equal(bound.requiredFundingWei,String(SELF_FUNDED_CAP_WEI));
 for(const mutate of [t=>{t.frames[1].limits.execution=999999n;},t=>{t.frames[1].limits.state=-1n;},t=>{t.frames[0].flags=2;},t=>{t.blobVersionedHashes=['0x'+'01'.repeat(32)];},t=>{t.fees.maxFeePerGas=3000000000n;}]){const bad=structuredClone(tx);mutate(bad);assert.throws(()=>selfFundedFeeBound(bad),/Unsupported|cap/);}
 assert.throws(()=>unsignedSelfFundedTransaction({...input,payer:addr(3)}),/no payer/);
 assert.throws(()=>unsignedSelfFundedTransaction({...input,chainId:1}),/chain1337/);
 assert.throws(()=>unsignedSelfFundedTransaction({...input,data:'0x'+'00'.repeat(68)}),/Only ActionRecorder/);
});

// Synthetic normalized proof objects test oracle gates; none are live receipts.
function mockProof(sender=addr(101)){
 const action=(operation,parameter)=>({source:'LIVE_EIP8141',frameIndex:1,frameStatus:'0x1',actualCaller:sender,expectedCaller:sender,actualOperation:operation,expectedOperation:operation,actualParameter:parameter,expectedParameter:parameter,receiptHashVerified:true,actionEvidenceVerified:true,payer:sender,payerEvidenceVerified:true});
 return {sender,payer:sender,originalDescriptorDigest:investigation.experiments[1].execution.descriptor.contentDigest,maximumCostWei:'1000000000000000',balanceWei:'1000000000000000',layoutVerified:true,actionFrameIndex:1,fixture:'unsafe',ownedFixture:true,signatureRetained:true,targetUnchanged:true,canonicalHashChanged:true,originalAuthorizationVerified:true,isolatedContextsVerified:true,baseline:action(1,10),tampered:action(2,10)};
}
test('self-funded oracle separates insufficient balance, fee limits and wrong payer from authorization',()=>{
 const e=mockProof();assert.equal(classifySelfFundedExperiment({...e,balanceWei:'0',failureClass:'authorization'}).failureClass,'INSUFFICIENT_SENDER_BALANCE');
 assert.equal(classifySelfFundedExperiment({...e,balanceWei:undefined,failureClass:'transport'}).verdict,'TRANSPORT_FAILURE');
 assert.equal(classifySelfFundedExperiment({...e,payer:addr(3)}).failureClass,'SENDER_PAYER_MISMATCH');
 assert.equal(classifySelfFundedExperiment({...e,maximumCostWei:String(SELF_FUNDED_CAP_WEI+1n)}).failureClass,'FEE_CAP');
 assert.equal(classifySelfFundedExperiment({...e,baseline:{...e.baseline,payerEvidenceVerified:false}}).verdict,'INCONCLUSIVE');
 const rejected={source:'LIVE_EIP8141',sender:e.sender,authorizationRevertData:toFunctionSelector('AuthorizationRejected()'),errorOriginVerified:true,authorizationRejected:true,actionAbsentVerified:true};
 assert.equal(classifySelfFundedExperiment({...e,fixture:'safe',tampered:rejected}).verdict,'BOUND_HOLDS');
 assert.equal(classifySelfFundedExperiment({...e,fixture:'safe',tampered:{...rejected,authorizationRevertData:'0x'}}).verdict,'INCONCLUSIVE');
});
test('oracle requires actual action-frame proof and a separately verified fresh reproduction before finding',()=>{
 const e=mockProof();assert.equal(classifySelfFundedExperiment(e).finding,false);
 assert.equal(classifySelfFundedExperiment({...e,tampered:{...e.tampered,actionEvidenceVerified:false}}).verdict,'INCONCLUSIVE');
 assert.equal(classifySelfFundedExperiment({...e,actionFrameIndex:2}).verdict,'INCONCLUSIVE');
 assert.equal(classifySelfFundedExperiment({...e,independentReproduction:mockProof()}).finding,false);
 assert.equal(classifySelfFundedExperiment({...e,independentReproduction:mockProof(addr(102))}).finding,true);
 const other=mockProof(addr(102));other.tampered.actualOperation=5;other.tampered.expectedOperation=5;
 assert.equal(classifySelfFundedExperiment({...e,independentReproduction:other}).finding,false);
 assert.equal(classifySelfFundedExperiment({...e,independentReproduction:{...mockProof(addr(102)),originalDescriptorDigest:'00'.repeat(32)}}).finding,false);
});
test('self-funded readiness preserves actual Sonnet descriptor and isolates all funding/deployment requirements',async()=>{
 const preflight=await load('evidence/swarm/phase-3/preflight.json'),secondHead=await load('evidence/swarm/phase-3/head-second.json');
 const p=await prepareSelfFundedReadiness({investigation,preflight,secondHead,variant:1});
 assert.deepEqual(p.derivation.originalDescriptor,investigation.experiments[1].execution.descriptor);assert.deepEqual(p.originalModel.mutationValues,{operation:2,parameter:10});assert.equal(p.derivation.preparedActionFrameIndex,1);assert.equal(p.requiresSeparateSponsor,false);
 assert.equal(p.deployments.length,5);assert.equal(p.cases.length,4);assert(p.cases.every(x=>x.nonceSeq===null));assert.equal(p.feeExposure.sourceWalletFundingTargetWei,'66000000000000000');assert.equal(p.topLevelTransactionCounts.total,13);assert.equal(p.fundingTransfersSent,0);
 assert(!p.blockers.some(x=>/sponsor/i.test(x)));assert.equal(p.technicallyReadyForApproval,false);
 await assert.rejects(prepareSelfFundedReadiness({investigation,preflight,secondHead,variant:0}),/pins the original/);
 await assert.rejects(prepareSelfFundedReadiness({investigation,preflight,secondHead,variant:1,submit:true}),/human approval/);
});
test('official devnet survey issues only bounded read calls and never changes the execution allowlist',async()=>{
 const calls=[],before=structuredClone(AUTHORIZED_SWARM_ENDPOINTS);
 const rpcFn=async(endpoint,method)=>{calls.push({endpoint,method});if(method==='eth_getBlockByNumber')return {number:calls.length<=24?'0x1':'0x2'};if(method==='eth_chainId')return '0x539';return {};};
 const first=await surveyDevnets({rpcFn}),second=await surveyDevnets({previous:first,rpcFn});
 assert.equal(first.requestCount,24);assert.equal(second.requestCount,3);assert(second.advancement.every(n=>n.advancing==='YES'));assert(!calls.some(c=>/send|simulate|set|faucet/i.test(c.method)));assert.deepEqual(AUTHORIZED_SWARM_ENDPOINTS,before);assert(!before.includes(SURVEY_NETWORKS[0].rpc));
 const failed=await surveyDevnets({previous:first,rpcFn:async()=>{throw Error('offline');}});assert(failed.advancement.every(n=>n.advancing==='UNKNOWN'));
});
