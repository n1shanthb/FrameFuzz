import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { runSuite } from '../src/runner.mjs';

async function withMockRpc(fn, chain = '0x539') {
  const calls = [];
  const server = createServer(async (req,res) => {
    const chunks=[]; for await (const c of req) chunks.push(c);
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    calls.push(body.method);
    const out = {jsonrpc:'2.0',id:body.id};
    if(body.method==='eth_chainId')out.result=chain;
    else if(body.method==='eth_sendFrameTransaction') {
      if(body.params[0]==='0xdead') out.error={code:-32000,message:'StorageReadNonSender'};
      else out.result=`0x${'f'.repeat(64)}`;
    } else if(body.method==='eth_getTransactionReceipt')out.result=null;
    else out.error={code:-32601,message:'method not found'};
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(out));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {await fn(`http://127.0.0.1:${server.address().port}`,calls);}
  finally{await new Promise(resolve=>server.close(resolve));}
}
const cases=[
  {id:'baseline',paths:[{id:'alt',method:'eth_sendFrameTransaction',params:['0xcafe'],expected:'accepted'}]},
  {id:'storage-rejection',paths:[{id:'alt',method:'eth_sendFrameTransaction',params:['0xdead'],expected:'rejected',expectedRule:'StorageReadNonSender'}]},
];
test('live RPC admissions and rejects produce evidence without claiming execution',async()=>{
  await withMockRpc(async(url,calls)=>{
    const out=await runSuite(cases,{rpcUrl:url,allowChainId:1337,submit:true});
    assert.equal(out.source,'LIVE_RPC_SUBMISSION');
    assert.equal(out.totals.matched,2);
    assert.equal(out.results[0].paths[0].receipt.state,'not_checked');
    assert.equal(out.results[0].paths[0].observed.status,'accepted');
    assert.deepEqual(calls,['eth_chainId','eth_sendFrameTransaction','eth_sendFrameTransaction']);
  });
});
test('preview never submits transactions',async()=>{
  await withMockRpc(async(url,calls)=>{
    const out=await runSuite(cases,{rpcUrl:url,allowChainId:1337,submit:false});
    assert.equal(out.totals.inconclusive,2);
    assert.deepEqual(calls,['eth_chainId']);
  });
});
test('explicit chain allowlist prevents accidental cross-chain broadcast',async()=>{
  await withMockRpc(async(url,calls)=>{
    await assert.rejects(runSuite(cases,{rpcUrl:url,allowChainId:8453,submit:true}),/SAFETY STOP/);
    assert.deepEqual(calls,['eth_chainId']);
  });
});
test('chain ID 1 is prohibited even with matching allowlist',async()=>{
  await withMockRpc(async(url,calls)=>{
    await assert.rejects(runSuite(cases,{rpcUrl:url,allowChainId:1,submit:true}),/mainnet submissions are disabled/);
    assert.deepEqual(calls,['eth_chainId']);
  },'0x1');
});
