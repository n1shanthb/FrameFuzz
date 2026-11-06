import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareEfFundingPacket,EF_GATEWAY,EF_SHARED_GENESIS,FRAMEFUZZ_SENDER} from '../src/adapters/ef-funding.mjs';
const mock=overrides=>async(url,method,params=[])=>{
 assert.equal(url,EF_GATEWAY);assert(!/^eth_send|faucet/i.test(method));
 if(method in overrides)return overrides[method];
 if(method==='eth_chainId')return '0x539';if(method==='web3_clientVersion')return 'ethrex/pinned';if(method==='eth_blockNumber')return '0x10';
 if(method==='eth_getBalance')return params[0].toLowerCase()===EF_SHARED_GENESIS.toLowerCase()?'0x100000000000000000000':'0x0';
 if(method==='eth_getTransactionCount')return params[0].toLowerCase()===EF_SHARED_GENESIS.toLowerCase()?'0x91':'0x0';
 if(method==='eth_getCode')return '0x';if(method==='eth_gasPrice')return '0x8';if(method==='eth_estimateGas')return '0x32a1f';
 if(method==='skandha_explorer_info')return {faucetEnabled:true};throw Error(method);
};
test('resolves one exact shared-devnet transfer without signing or broadcasting',async()=>{
 const p=await prepareEfFundingPacket({rpcFn:mock({})});
 assert.equal(p.intent.from,EF_SHARED_GENESIS);assert.equal(p.intent.to,FRAMEFUZZ_SENDER);assert.equal(p.intent.nonce,'145');
 assert.equal(p.intent.valueWei,'500000000000000');assert.equal(p.intent.gasLimit,'250000');assert.equal(p.intent.gasPriceWei,'2000000');
 assert.equal(p.intent.maximumGasFeeWei,'500000000000');assert.equal(p.intent.maximumSourceDebitWei,'500500000000000');
 assert.equal(p.faucetAlternative.suitableForExactAmount,false);assert.equal(p.writes,0);assert.equal(p.broadcasts,0);assert.match(p.approvalDigest,/^[0-9a-f]{64}$/);
});
test('fails closed on wrong chain, contract accounts, excessive gas, or insufficient source funds',async()=>{
 await assert.rejects(prepareEfFundingPacket({rpcFn:mock({eth_chainId:'0x1'})}),/chain mismatch/);
 await assert.rejects(prepareEfFundingPacket({rpcFn:mock({eth_getCode:'0x01'})}),/code-empty/);
 await assert.rejects(prepareEfFundingPacket({rpcFn:mock({eth_estimateGas:'0x40000'})}),/gas estimate/);
 await assert.rejects(prepareEfFundingPacket({rpcFn:mock({eth_getBalance:'0x0'})}),/insufficient/);
});
