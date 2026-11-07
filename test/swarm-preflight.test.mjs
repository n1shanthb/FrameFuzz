import test from 'node:test';import assert from 'node:assert/strict';
import {getContractAddress} from 'viem';
import {spawnSync} from 'node:child_process';
import {swarmPreflight,readOnlySwarmRpc,keyedNonceSlot,AUTHORIZED_SWARM_ENDPOINTS} from '../src/swarm/preflight.mjs';
process.env.FRAMEFUZZ_SWARM='on';
const addr=n=>'0x'+String(n).repeat(40),payer='0x346408e66ff4446c5d5f1ab0155ce7e3d319ea30';
function mockRpc(calls){return async(url,method,params=[])=>{
 calls.push({url,method,params});
 switch(method){
 case 'eth_chainId':return '0x539';
 case 'web3_clientVersion':return 'ethrex/9aa3645d795945c64400f41a70aace0edfa7f383';
 case 'skandha_explorer_info':return {chainId:1337,version:'v4.1.1',commit:'',bootId:'mock'};
 case 'eth_getBlockByNumber':return {number:'0x1',timestamp:'0x7d0'};
 case 'eth_getCode':return params[0].toLowerCase()===payer?'0x6000':'0x';
 case 'eth_getBalance':return '0xde0b6b3a7640000';
 case 'eth_getTransactionCount':return '0x3';
 case 'eth_getStorageAt':return '0x'+'0'.repeat(64);
 default:assert.fail('Unexpected method '+method);
 }
};}
test('read-only RPC guard rejects every write method and unauthorized endpoint before transport',async()=>{
 const calls=[],read=readOnlySwarmRpc(mockRpc(calls));
 for(const method of ['eth_sendRawTransaction','eth_sendFrameTransaction','eth_sendTransaction','debug_setStorageAt','anvil_setBalance'])await assert.rejects(read(AUTHORIZED_SWARM_ENDPOINTS[0],method),/allowlist/);
 await assert.rejects(read('https://mainnet.invalid','eth_chainId'),/allowlist/);assert.equal(calls.length,0);
});
test('preflight produces a conditional five-deployment/four-submission manifest with isolated keyed nonces',async()=>{
 const calls=[],r=await swarmPreflight({deployer:addr(1),owner:addr(2),rpcFn:mockRpc(calls),env:{},now:2000000});
 assert.equal(r.verdict,'STOP_BEFORE_LIVE_APPROVAL');assert.equal(r.liveExecutions,0);assert.equal(r.deployments,0);assert.equal(r.wallet.secureKeyConfigured,false);assert.equal(r.writeHealth,'UNVERIFIED_READ_ONLY');
 assert.equal(r.deploymentPlan.deployments.length,5);assert.equal(r.deploymentPlan.submissions.length,4);assert.equal(r.deploymentPlan.totalDeploymentFeeBoundWei,'60000000000000000');
 const planned=r.deploymentPlan.deployments;assert.equal(planned[0].predictedAddress,getContractAddress({from:addr(1),nonce:3n}));assert.equal(new Set(planned.map(d=>d.predictedAddress)).size,5);
 for(const d of planned){assert.match(d.initCode,/^0x[\da-f]+$/i);assert.equal(d.valueWei,'0');}
 for(const d of planned.slice(1)){assert.equal(d.context.slot,keyedNonceSlot(d.predictedAddress));assert.equal(d.context.nextSequence,'0');assert.deepEqual(d.constructorArguments,[addr(2),planned[0].predictedAddress,payer]);}
 assert(r.blockers.some(x=>x.includes('canonical')));assert(r.blockers.some(x=>x.includes('human')));assert(!r.readMethods.some(m=>/send|deploy|write/i.test(m)));
 assert.equal(r.latestBlock.ageSeconds,0);
});
test('preflight stops on wrong chain and reports missing wallet without inventing deployments',async()=>{
 const calls=[];await assert.rejects(swarmPreflight({rpcFn:async(_,method)=>{calls.push(method);return '0x1';},env:{}}),/mainnet/);assert.deepEqual(calls,['eth_chainId']);
 const r=await swarmPreflight({rpcFn:mockRpc([]),env:{},now:2000000});assert.equal(r.deploymentPlan.status,'UNRESOLVED_WALLET_CONTEXT');assert.equal(r.wallet.deployer,null);assert(r.deploymentPlan.deployments.every(d=>d.predictedAddress===null));assert(r.deploymentPlan.deployments.slice(1).every(d=>d.initCode===null));
});
test('CLI feature gate and write rejection leave the existing command surface usable',()=>{
 const env={...process.env};delete env.FRAMEFUZZ_SWARM;
 let r=spawnSync(process.execPath,['bin/framefuzz.mjs','swarm','offline'],{env,encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/Swarm disabled/);
 for(const flag of ['--deploy','--submit','--publish']){r=spawnSync(process.execPath,['bin/framefuzz.mjs','swarm','preflight',flag],{env:{...env,FRAMEFUZZ_SWARM:'on'},encoding:'utf8'});assert.equal(r.status,1);assert.match(r.stderr,/separate human approval/);}
 r=spawnSync(process.execPath,['bin/framefuzz.mjs','help'],{env,encoding:'utf8'});assert.equal(r.status,0);assert.match(r.stdout,/saved-demo/);
});
