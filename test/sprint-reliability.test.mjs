import test from 'node:test';
import assert from 'node:assert/strict';
import {assertTestChain} from '../src/safety.mjs';
import {RpcResponseError,getReceipt} from '../src/rpc.mjs';
import {describeRpcError,compareAdmission} from '../src/verdict.mjs';
import {toReplay} from '../src/reports.mjs';
import {execFileSync} from 'node:child_process';

test('execution chain allowlist refuses other production and unapproved test chains',()=>{
  for(const id of [10,8453,42161,11155111,7794095])assert.throws(()=>assertTestChain(id,id),/allowlist/);
  assert.doesNotThrow(()=>assertTestChain(1337,1337));
  assert.doesNotThrow(()=>assertTestChain(31337,31337));
  assert.throws(()=>execFileSync(process.execPath,['bin/deploy-reserve.mjs'],{stdio:'pipe'}),e=>/explicit --submit/.test(e.stderr.toString()));
});
test('wrapped nonce and funding errors cannot be mistaken for policy rejection',()=>{
  const diagnostic='unknown-detail-'.repeat(200);
  assert.equal(describeRpcError(new RpcResponseError(-32000,'unknown gateway response',diagnostic)).data,diagnostic);
  for(const [text,kind] of [['Invalid params: nonce too low','nonce_or_duplicate'],['Invalid params: insufficient funds','funding'],['transaction underpriced','unclassified_rejection']]){
    const error=describeRpcError(new RpcResponseError(-32000,text,{detail:'original diagnostic'}));
    assert.equal(error.errorClass,kind);assert.equal(error.data.detail,'original diagnostic');
    if(kind!=='unclassified_rejection')assert.equal(compareAdmission('rejected',error,'MAX_VERIFY_GAS').verdict,'INCONCLUSIVE');
  }
});
test('outer inclusion, individual frame receipts and action state proof stay separate',async()=>{
  const hash='0x'+'a'.repeat(64);
  const receipt=await getReceipt('mock',hash,{rpcFn:async()=>({transactionHash:hash,blockNumber:'0x1',status:'0x1',frameReceipts:[{status:'0x1'},{status:'0x0'},{status:'unknown'}]})});
  assert.equal(receipt.state,'included_success');
  assert.deepEqual(receipt.frames.items.map(x=>x.state),['success','reverted','unknown']);
  assert.equal(receipt.actionStateProof,'not_collected');assert.ok(receipt.checkedAt);
});
test('replay export labels signed history separately from semantic regeneration',()=>{
  const output={source:'LIVE_RPC_SUBMISSION',chainId:1337,campaign:{seed:42},results:[{id:'case',mutation:{value:12},reproduction:{cli:'unsigned preview'},paths:[{id:'alt',observed:{status:'accepted'},receipt:{state:'included_success'},replay:{method:'eth_sendFrameTransaction',params:['0xcafe'],signedRaw:'0xcafe'}}]}]};
  const replay=toReplay(output);
  assert.equal(replay.broadcastAllowed,false);assert.equal(replay.freshSigningRequired,true);
  assert.deepEqual(replay.cases[0].semanticDescriptor.mutation,{value:12});
  assert.equal(replay.cases[0].historicalOutcomes[0].receipt.state,'included_success');
  assert.equal(replay.cases[0].paths[0].signedRaw,'0xcafe');
  assert.ok(!JSON.stringify(replay.cases[0].semanticDescriptor).includes('signedRaw'));
  assert.equal(output.broadcastAllowed,undefined);
});
