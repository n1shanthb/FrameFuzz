import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {encodeAbiParameters,keccak256} from 'viem';
import {compileOwnedFixtures} from '../src/swarm/compile.mjs';
import {assertSwarmEnabled,rejectNetworkWrites} from '../src/swarm/gate.mjs';
import {frameMutationDefinition,generateFrameMutation,replayFrameMutation} from '../src/mutations/frames.mjs';
import {prepareAuthorizationPair,unsignedValidatorTransaction} from '../src/adapters/sender-validator.mjs';
import {currentEipSignatureHash,workshopSigningHash,unsafeIntentHash} from '../src/swarm/signatures.mjs';
import {classifyAuthorizationExperiment} from '../src/swarm/invariant.mjs';
import {generateMutations} from '../src/mutations/generator.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const addr=n=>'0x'+String(n).repeat(40),ownerAccount=privateKeyToAccount(generatePrivateKey());
const mutation=generateFrameMutation(frameMutationDefinition({seed:42}));
test('swarm is opt-in and deployment/submit/publish flags fail closed',()=>{
 for(const value of [undefined,'off','true'])assert.throws(()=>assertSwarmEnabled({FRAMEFUZZ_SWARM:value}),/disabled/);
 assert.doesNotThrow(()=>assertSwarmEnabled({FRAMEFUZZ_SWARM:'on'}));for(const flag of ['submit','deploy','publish'])assert.throws(()=>rejectNetworkWrites({[flag]:true}),/read-only/);
});
test('real solc0.8.28 compiles both owned validators and the action recorder reproducibly',async()=>{
 const a=await compileOwnedFixtures(),b=await compileOwnedFixtures();assert.match(a.compiler,/^0.8.28\+/);assert.equal(a.inputDigest,b.inputDigest);
 for(const name of ['SenderValidatorUnsafe','SenderValidatorSafe','ActionRecorder']){assert(a.artifacts[name].bytecode.length>100);assert(a.artifacts[name].abi.length>0);}
 assert.notEqual(a.artifacts.SenderValidatorUnsafe.bytecode,a.artifacts.SenderValidatorSafe.bytecode);
 assert(a.artifacts.ActionRecorder.abi.some(x=>x.type==='event'&&x.name==='ActionRecorded'));
});
test('version2 changes only action calldata and descriptors reject unsupported fields/tampering',()=>{
 assert.equal(replayFrameMutation(mutation).definitionDigest,mutation.definitionDigest);assert.notEqual(mutation.authorized.data,mutation.tampered.data);
 const changed=structuredClone(mutation);changed.tampered.data='0x';assert.throws(()=>replayFrameMutation(changed),/integrity/);
 assert.throws(()=>generateFrameMutation({...mutation.definition,command:'execute'}),/Unsupported/);
 assert.throws(()=>frameMutationDefinition({operation:1,parameter:10}),/must change/);
});
test('owner authorization for A is retained: unsafe hash ignores B calldata, safe hash changes',async()=>{
 for(const fixture of ['unsafe','safe']){const p=await prepareAuthorizationPair({fixture,ownerAccount,sender:addr(1),payer:addr(2),target:addr(3),mutation});
 assert.equal(p.invariants.authorizedOwnerRecovered,true);assert.equal(p.invariants.tamperedOwnerRecovered,fixture==='unsafe');assert.equal(p.invariants.canonicalHashChanged,true);assert.equal(p.invariants.sameWitness,true);assert.equal(p.invariants.sameTarget,true);
 assert.equal(p.authorized.transaction.frames[0].flags,2);assert.equal(p.authorized.transaction.frames[1].flags,1);assert.equal(p.authorized.transaction.frames[0].target,null);
 assert.equal(p.authorized.transaction.signatures[0].scheme,0);assert.equal(p.authorized.transaction.signatures[0].signer,'0x');assert.equal(p.authorized.transaction.signatures[0].msg,'0x');assert.equal(p.authorized.transaction.signatures[0].signature.length,132);
 assert.equal(p.authorized.transaction.nonceSeq,p.tampered.transaction.nonceSeq);assert.notEqual(p.authorized.raw,p.tampered.raw);
 }
});
test('domain separation binds owned account, chain, nonce and signed target',()=>{
 const c={chainId:1337,sender:addr(1),nonce:0,target:addr(3)},h=unsafeIntentHash(c);
 assert.equal(h,keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'uint256'},{type:'address'}],[1337n,addr(1),0n,addr(3)])));
 for(const change of [{chainId:1},{sender:addr(2)},{nonce:1},{target:addr(4)}])assert.notEqual(h,unsafeIntentHash({...c,...change}));
 assert.throws(()=>unsignedValidatorTransaction({...c,payer:addr(2),data:mutation.authorized.data,chainId:1}),/1337/);
});
test('current EIP commits to witness length, explicit msg content, and action calldata without circularity',()=>{
 const legacy=unsignedValidatorTransaction({sender:addr(1),payer:addr(2),target:addr(3),data:mutation.authorized.data});
 const vector={chainId:1337,nonce:0,sender:legacy.sender,frames:legacy.frames,signatures:legacy.signatures,fees:{maxFee:1000000000000000n,maxPriorityFeePerGas:1000000000n},blobVersionedHashes:[]};
 const h=currentEipSignatureHash(vector),rewrite=structuredClone(vector);rewrite.signatures[0].signature='0x'+'11'.repeat(65);assert.equal(currentEipSignatureHash(rewrite),h);
 rewrite.signatures[0].signature+='00';assert.notEqual(currentEipSignatureHash(rewrite),h);
 const old=structuredClone(legacy);old.signatures[0].signature+='00';assert.equal(workshopSigningHash(old),workshopSigningHash(legacy));
 const explicit=structuredClone(vector);explicit.signatures[0].msg='0x'+'22'.repeat(32);const explicitHash=currentEipSignatureHash(explicit);explicit.signatures[0].signature='0x'+'11'.repeat(65);assert.notEqual(currentEipSignatureHash(explicit),explicitHash);
 const mutated=structuredClone(vector);mutated.frames[2].data=mutation.tampered.data;assert.notEqual(currentEipSignatureHash(mutated),h);
 assert.throws(()=>currentEipSignatureHash(legacy),/do not mix/);explicit.signatures[0].msg='0x'+'00'.repeat(32);assert.throws(()=>currentEipSignatureHash(explicit),/Invalid explicit/);
});
test('v1 historical mutation definition digest remains byte-for-byte compatible',async()=>{
 const report=JSON.parse(await readFile('evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json'));
 const d=report.results[0].reproduction;assert.equal(generateMutations(d.definition)[0].definitionDigest,d.definitionDigest);
});
test('admission and an outer successful receipt alone never prove unauthorized action',()=>{
 assert.equal(classifyAuthorizationExperiment({fixture:'unsafe',outerReceiptStatus:'0x1',admitted:true}).finding,false);
 for(const failureClass of ['nonce','funding','layout','gas','transport','infrastructure','execution','authorization'])assert.equal(classifyAuthorizationExperiment({failureClass}).finding,false);
 const proof=(operation,parameter)=>({source:'LIVE_EIP8141',frameStatus:'0x1',actualCaller:addr(1),expectedCaller:addr(1),actualOperation:operation,expectedOperation:operation,actualParameter:parameter,expectedParameter:parameter,receiptHashVerified:true,actionEvidenceVerified:true});
 const e={fixture:'unsafe',ownedFixture:true,signatureRetained:true,targetUnchanged:true,canonicalHashChanged:true,originalAuthorizationVerified:true,isolatedContextsVerified:true,baseline:proof(1,10),tampered:proof(2,999)};
 assert.equal(classifyAuthorizationExperiment(e).verdict,'BINDING_VIOLATED');assert.equal(classifyAuthorizationExperiment(e).finding,false);assert.equal(classifyAuthorizationExperiment({...e,independentlyReproduced:true}).finding,true);
 e.tampered.actualParameter=1;assert.equal(classifyAuthorizationExperiment(e).verdict,'INCONCLUSIVE');
 assert.equal(classifyAuthorizationExperiment({...e,fixture:'safe',tampered:{source:'LIVE_EIP8141',authorizationRejected:true,actionAbsentVerified:true}}).verdict,'BOUND_HOLDS');
});
