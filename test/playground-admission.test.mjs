import test from 'node:test';
import assert from 'node:assert/strict';
import {generatePrivateKey} from 'viem/accounts';
import {keccak256} from 'viem';
import {admissionReadiness,prepareSponsoredCandidate,EF_PUBLIC,EF_ALTERNATIVE} from '../src/playground/admission.mjs';
const payer='0x'+'1'.repeat(40),recipient='0x'+'2'.repeat(40);
const config={paymasters:{basic:payer},paymasterCodeHashes:{basic:keccak256('0x6000')},minSponsorBalanceWei:'1000'};
const read=(url,method,params=[])=>{
 assert.ok([EF_PUBLIC,EF_ALTERNATIVE].includes(url));
 if(method==='eth_chainId')return '0x539';
 if(method==='web3_clientVersion')return 'ethrex-test';
 if(method==='eth_blockNumber')return '0x12';
 if(method==='eth_getCode')return '0x6000';
 if(method==='eth_getBalance')return params[0]===payer?'0x3e8':'0x0';
 if(method==='eth_getTransactionCount')return '0x0';
 throw Error('Read-only transport rejects '+method);
};
test('new source identity and ordinary role never yield a frame candidate or admission verdict',async()=>{
 const a={status:'READY',analysisId:'a',sourceDigest:'x',detectedRole:{role:'UNKNOWN',basis:'ordinary'}};
 const b={...a,analysisId:'b',sourceDigest:'y'};
 const x=await admissionReadiness(a,{rpcFn:read,config,env:{}}),y=await admissionReadiness(b,{rpcFn:read,config,env:{}});
 assert.notEqual(x.analysisId,y.analysisId);
 assert.equal(x.supportedFrameRole,'NONE');assert.equal(x.signedComparisonCandidate,'BLOCKED');assert.deepEqual(x.observedAdmissions,[]);
 assert.equal(x.publicEndpoint.submissionMethod,'eth_sendRawTransaction');assert.equal(x.alternativeEndpoint.submissionMethod,'eth_sendFrameTransaction');
 await assert.rejects(()=>prepareSponsoredCandidate({analysis:a,readiness:x,senderKey:generatePrivateKey(),payer,recipient,nonce:0}),/BLOCKED_PRECONDITION/);
});
test('missing code, payer funding and operator wallet remain separate blockers',async()=>{
 const analysis={status:'READY',analysisId:'a',sourceDigest:'x',detectedRole:{role:'UNKNOWN'}};
 const r=await admissionReadiness(analysis,{rpcFn:(url,method,params)=>method==='eth_getCode'?'0x':method==='eth_getBalance'?'0x0':read(url,method,params),config,env:{}});
 assert.equal(r.deployment.status,'MISSING');assert.equal(r.walletAndFunding.status,'MISSING');assert.equal(r.operatorWalletConfigured,false);assert.equal(r.writes,0);
});
test('one prepared candidate retains signed identity across both distinct request formats',async()=>{
 const analysis={status:'READY',analysisId:'a',sourceDigest:'x'};
 const readiness={classification:'READY_FOR_CANDIDATE',analysisId:'a',deployment:{address:payer}};
 const c=await prepareSponsoredCandidate({analysis,readiness,senderKey:generatePrivateKey(),payer,recipient,nonce:0});
 assert.equal(c.requests.public.method,'eth_sendRawTransaction');assert.equal(c.requests.alternative.method,'eth_sendFrameTransaction');
 assert.equal(c.requests.public.params[0],c.raw);assert.deepEqual(c.requests.alternative.params[0],c.wire);
 assert.equal(c.hash.length,66);assert.deepEqual(c.observedAdmissions,[]);assert.equal(c.broadcasts,0);
});
