import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeAbiParameters,keccak256} from 'viem';
import {inspectUniswap} from '../src/adapters/uniswap-state.mjs';
import {runMutationCampaign} from '../src/mutations/campaign.mjs';
import {buildRegressionCase,validateRegressionCase,contentDigest} from '../src/arkiv/case.mjs';
import {describeRpcError} from '../src/verdict.mjs';
import {RpcResponseError} from '../src/rpc.mjs';
import {compareMutation} from '../src/mutations/oracle.mjs';
const address=n=>'0x'+String(n).repeat(40),pool='0x'+'a'.repeat(64),endpoint='http://127.0.0.1:9999';
const config={chainId:1337,authorizedEndpoints:[endpoint],stateView:address(1),poolManager:address(2),poolId:pool,uniswapCodeHashes:{stateView:keccak256('0x6000'),poolManager:keccak256('0x6000')}};
const read=async(_,method,params)=>method==='eth_chainId'?'0x539':method==='eth_getCode'?'0x6000':params[0].data.length===10?encodeAbiParameters([{type:'address'}],[address(2)]):encodeAbiParameters([{type:'uint160'},{type:'int24'},{type:'uint24'},{type:'uint24'}],[0n,0,0,0]);
test('Uniswap preflight pins both runtime hashes and manager binding, records zero pool state honestly',async()=>{
  const u=await inspectUniswap(config,endpoint,{rpcFn:read});assert.equal(u.slot0.initialized,false);assert.equal(u.slot0.sqrtPriceX96,'0');assert.equal(u.contracts.poolManager.address,address(2));
  await assert.rejects(inspectUniswap(config,endpoint,{rpcFn:async(...args)=>args[1]==='eth_getCode'?'0x':read(...args)}),/bytecode/);
  await assert.rejects(inspectUniswap({...config,poolManager:address(3)},endpoint,{rpcFn:read}),/different PoolManager/);
});
test('Uniswap inspection refuses unauthorized endpoints and mainnet before reading contracts',async()=>{
  await assert.rejects(inspectUniswap(config,'https://untrusted.test',{rpcFn:()=>assert.fail('must not call')}),/authorized/);
  await assert.rejects(inspectUniswap(config,endpoint,{rpcFn:async()=> '0x1'}),/mainnet/);
});
test('sidecar disk exhaustion is infrastructure failure, never a rule discrepancy or acceptance',()=>{
  const observed=describeRpcError(new RpcResponseError(-32603,'IO error: No space left on deviceWhile appending to file: /usr/app/data/userOps/000085.log: No space left on device'));
  assert.equal(observed.status,'rejected');assert.equal(observed.errorClass,'gateway_infrastructure');assert.equal(compareMutation({expected:'accepted',confidence:'VERIFIED'},observed).verdict,'INFRASTRUCTURE_FAILURE');
  assert.equal(compareMutation({expected:'accepted',confidence:'VERIFIED'},{status:'rejected',message:'Internal error'},{admission:{checks:[{rule:'mempool',verdict:'fail',detail:'IO error: No space left on device'}]}}).verdict,'INFRASTRUCTURE_FAILURE');
});
test('Uniswap registry case preserves protocol identifiers while replay stays unsigned and untrusted',async()=>{
  const report=await runMutationCampaign({suite:'uniswap-storage',seed:42,count:3,preview:true});
  const index=report.results.findIndex(c=>c.mutation.setup.staked),original=report.results[index];
  report.uniswap=await inspectUniswap(config,endpoint,{rpcFn:read});
  for(const p of original.paths)p.metadata={transaction:{payer:address(3),payerCodeHash:keccak256('0x6000'),stake:{registry:address(4),amountWei:'10000000000000000',delaySeconds:'86400',withdrawTime:'0',staked:true}}};
  const record=buildRegressionCase({report,caseIndex:index,publisher:address(5),expirationBlocks:100,expiresAtBlock:2000n});
  assert.equal(record.uniswap.contracts.stateView.address,address(1));assert.equal(record.uniswap.policies.public.expected,'rejected');assert.equal(record.uniswap.policies.alt.expected,'accepted');assert.equal(record.evidence.classification,'PREVIEW');
  const preview=await runMutationCampaign({definition:record.reproduction.definition,variant:record.reproduction.variantIndex,preview:true});assert.equal(preview.submissions,0);assert.equal(preview.results[0].mutation.setup.staked,true);assert.equal(preview.results[0].paths[0].oracle.confidence,'UNKNOWN');
  record.uniswap.contracts.poolManager.privateKey='secret';record.contentDigest=contentDigest(record);assert.throws(()=>validateRegressionCase(record),/metadata/);
});
