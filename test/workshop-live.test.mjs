import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { recoverAddress, keccak256, parseTransaction } from 'viem';
import { decodeTx, sigHash } from '@forshtat/hegota-support/tx';
import { buildSponsored, profile } from '../src/adapters/workshop-codec.mjs';
import { workshopPlugin } from '../src/adapters/workshop-live.mjs';
import { createAdapter } from '../src/adapters/index.mjs';
import { runSuite } from '../src/runner.mjs';
import { RpcResponseError } from '../src/rpc.mjs';
import { describeRpcError, compareAdmission } from '../src/verdict.mjs';
import { deployReserve } from '../src/adapters/workshop-setup.mjs';
import { refreshEvidence } from '../src/refresh.mjs';

const payer = `0x${'1'.repeat(40)}`, recipient = `0x${'2'.repeat(40)}`, registry = `0x${'3'.repeat(40)}`;
const config = { chainId:1337, recipient, stakingRegistry:registry, authorizedEndpoints:['http://127.0.0.1:9999'],paymasters:{basic:payer} };
test('real workshop encoding roundtrips and recovers the actual sender for each re-signed gas variant', async () => {
  const key = generatePrivateKey(), sender = privateKeyToAccount(key).address;
  const raws = new Set();
  for (const gas of [67199,67200,67201]) {
    const built = await buildSponsored({sender,payer,recipient,nonce:0,chainId:1337,privateKey:key,verificationGas:gas});
    const decoded = decodeTx(profile,built.raw), signature = decoded.signatures[0].signature;
    const recovered = await recoverAddress({hash:sigHash(profile,decoded),signature:{r:`0x${signature.slice(4,68)}`,s:`0x${signature.slice(68,132)}`,yParity:Number.parseInt(signature.slice(2,4),16)}});
    assert.equal(recovered.toLowerCase(),sender.toLowerCase()); assert.equal(decoded.frames[1].limits.execution,BigInt(gas));
    assert.equal(keccak256(built.raw),built.hash); assert.equal(typeof built.wire,'object'); raws.add(built.raw);
  }
  assert.equal(raws.size,3);
});
test('LIVE plugin checks nonce/funding/stake and runner uses object alt wire versus raw public bytes', async () => {
  const mockRpc = async (_,method) => method==='eth_chainId'?'0x539':method==='eth_getCode'?'0x6000':method==='eth_getBalance'?'0x0':method==='eth_getTransactionCount'?'0x0':`0x${'0'.repeat(192)}`;
  const plugin = workshopPlugin({...config,minSponsorBalanceWei:'0'}, {rpcFn:mockRpc});
  const adapter = createAdapter(plugin);
  const paths = ['public','alt'].map(pathId=>({id:pathId,method:pathId==='public'?'eth_sendRawTransaction':'eth_sendFrameTransaction',expected:'accepted',prepare:context=>adapter.build({...context,caseId:'basic',pathId,setup:{staked:false,configuration:{kind:'basic'}},model:{}})}));
  const calls = [];
  const output = await runSuite([{id:'basic',paths}],{rpcUrl:config.authorizedEndpoints[0],allowChainId:1337,submit:true,evidenceSource:'MOCK',rpcFn:async (_,method,params)=>{
    if(method==='eth_chainId')return '0x539';calls.push([method,typeof params[0]]);return `0x${'a'.repeat(64)}`;
  }});
  assert.deepEqual(calls,[['eth_sendRawTransaction','string'],['eth_sendFrameTransaction','object']]);
  assert.equal(output.totals.matched,1); assert.equal(output.results[0].paths[0].metadata.transaction.payer,payer);
  assert.ok(!JSON.stringify(output).includes('privateKey'));
});
test('LIVE plugin fails closed for wrong chain, unauthorized endpoint, missing sponsor or low funds', async () => {
  assert.throws(()=>workshopPlugin({...config,chainId:1}),/1337/);
  const adapter = createAdapter(workshopPlugin(config,{rpcFn:async (_,method)=>method==='eth_chainId'?'0x539':method==='eth_getCode'?'0x6000':'0x0'}));
  await assert.rejects(adapter.build({chainId:1337,rpcUrl:config.authorizedEndpoints[0],caseId:'low',pathId:'alt',setup:{configuration:{kind:'basic'}},model:{}}),/funding/);
  const plugin=workshopPlugin(config); await assert.rejects(plugin.accountFor({rpcUrl:'https://unapproved.test'}),/authorized/);
});
test('real gateway policy errors are not mistaken for malformed transactions by their wrappers', () => {
  for(const [code,message,rule] of [
    [-32000,'Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender','StorageReadNonSender'],
    [-32000,'Invalid params: Frame transaction prefix gas budget (frames + sig cost) exceeds MAX_VERIFY_GAS','MAX_VERIFY_GAS'],
    [-32602,'validation prefix execution gas sum 97201 + signature-verification cost 2800 = 100001 exceeds MAX_VERIFY_GAS 100000','MAX_VERIFY_GAS'],
  ]) assert.equal(compareAdmission('rejected',describeRpcError(new RpcResponseError(code,message)),rule).verdict,'EXPECTED_REJECT');
  assert.equal(compareAdmission('rejected',describeRpcError(new RpcResponseError(-32602,'invalid signature')),'MAX_VERIFY_GAS').verdict,'INCONCLUSIVE');
});
test('reserve deployment signs exact supplied creation data/value and verifies inclusion',async()=>{
  let hash,raw;
  const artifact={abi:[{type:'constructor',inputs:[{type:'address'},{type:'bytes32'}],stateMutability:'payable'}],bytecode:'0x6000'};
  const result=await deployReserve({config:{...config,stateView:payer,poolId:`0x${'0'.repeat(64)}`},artifact,privateKey:generatePrivateKey(),rpcUrl:config.authorizedEndpoints[0],rpcFn:async(_,method,params)=>{
    if(method==='eth_chainId')return '0x539';
    if(method==='eth_getBalance')return '0xde0b6b3a7640000';
    if(method==='eth_getTransactionCount')return '0x3';
    if(method==='eth_sendRawTransaction'){raw=params[0];hash=keccak256(raw);return hash;}
    if(method==='eth_getTransactionReceipt')return {transactionHash:hash,status:'0x1',contractAddress:payer,blockNumber:'0x1'};
    if(method==='eth_getCode')return '0x6000';
  }});
  const tx=parseTransaction(raw);assert.equal(tx.nonce,3);assert.equal(tx.chainId,1337);assert.equal(tx.value,150000000000000000n);assert.equal(tx.gas,6000000n);assert.equal(result.address,payer);
});
test('reserve deployment refuses wrong chain before signing or broadcasting',async()=>{
  await assert.rejects(deployReserve({config,rpcUrl:config.authorizedEndpoints[0],rpcFn:async()=> '0x1'}),/mainnet/);
});
test('evidence refresh is read-only and preserves original submission hash and replay inputs',async()=>{
  const hash=`0x${'a'.repeat(64)}`;
  const report={schema:'framefuzz.evidence.v1',source:'LIVE_RPC_SUBMISSION',chainId:1337,results:[{id:'one',paths:[{id:'alt',expected:'accepted',observed:{status:'accepted',hash},replay:{params:['0xcafe']}}]}]};
  const calls=[];
  const out=await refreshEvidence(report,{rpcUrl:'http://127.0.0.1',allowChainId:1337,rpcFn:async(_,method)=>{
    calls.push(method);if(method==='eth_chainId')return '0x539';return {status:'0x1',blockNumber:'0x1',transactionHash:hash};
  }});
  assert.deepEqual(calls,['eth_chainId','eth_getTransactionReceipt']);assert.equal(out.totals.matched,1);assert.equal(out.results[0].paths[0].observed.hash,hash);
  assert.deepEqual(out.results[0].paths[0].replay.params,['0xcafe']);assert.equal(report.results[0].paths[0].receipt,undefined);
});
