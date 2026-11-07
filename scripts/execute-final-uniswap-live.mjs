#!/usr/bin/env node
/** Exact approved Uniswap setup + rejection-first comparison. No re-signing. */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {encodeFunctionData,keccak256} from 'viem';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';
import {comparePolicyCandidate} from '../src/policy-comparison.mjs';

const EXPECTED={
  deploy:'0xddd9925994b02afe443f9804fb2f361aa595e2509b1d98b5339d57b040694032',
  candidate:'0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067',
  deployer:'0x366E6203603C39Eec1e75b3be6f078911447f235',
  paymaster:'0x3df63DFD230156C3656Bd4448326482030c31f96',
  runtime:'0xe2cbf6c54ab43cd85acb4451ed95cc59cfb1255448032ae7851084fd2ea47f0c',
  source:'85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec',
};
const REGISTRY='0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clean=e=>String(e?.message??e).slice(0,1000);
async function waitReceipt(hash,timeoutMs=180000){
  const end=Date.now()+timeoutMs;
  while(Date.now()<end){const receipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);if(receipt)return receipt;await sleep(2000);}
  throw Error(`RECEIPT_TIMEOUT ${hash}`);
}
async function depositInfo(address){
  const data=encodeFunctionData({abi:[{type:'function',name:'getDepositInfo',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'},{type:'uint32'},{type:'uint64'}]}],functionName:'getDepositInfo',args:[address]});
  const body=(await rpc(EF_CANONICAL_ENDPOINT,'eth_call',[{to:REGISTRY,data},'latest'])).slice(2);
  return {amountWei:String(BigInt('0x'+body.slice(0,64))),unstakeDelay:Number(BigInt('0x'+body.slice(64,128))),withdrawTime:Number(BigInt('0x'+body.slice(128,192)))};
}

const setup=JSON.parse(await readFile('evidence/prepared/2026-11-07/final-uniswap-setup-signed.json','utf8'));
let refreshedStake=null;try{refreshedStake=JSON.parse(await readFile('evidence/prepared/2026-11-07/final-uniswap-stake-resigned.json','utf8'));}catch{}
const stakePayload=refreshedStake??setup.stake;
const candidate=JSON.parse(await readFile('evidence/prepared/2026-11-07/final-uniswap-policy-candidate.json','utf8'));
const plan=JSON.parse(await readFile('runs/final-uniswap-preflight.json','utf8'));
if(setup.deployment.hash!==EXPECTED.deploy||candidate.hash!==EXPECTED.candidate)throw Error('APPROVED_IDENTITY_DRIFT');
if(setup.deployer.toLowerCase()!==EXPECTED.deployer.toLowerCase()||setup.predictedContract.toLowerCase()!==EXPECTED.paymaster.toLowerCase())throw Error('APPROVED_ADDRESS_DRIFT');
if(candidate.source.sha256!==EXPECTED.source||setup.deployment.expectedRuntimeHash!==EXPECTED.runtime)throw Error('SOURCE_OR_RUNTIME_DRIFT');
if(keccak256(setup.deployment.raw)!==EXPECTED.deploy||keccak256(candidate.raw)!==EXPECTED.candidate)throw Error('RAW_HASH_DRIFT');
assertEfRouting({
  canonical:{chainId:await rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion')},
  alternative:{chainId:await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),skandhaInfo:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),skandhaConfig:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config')},
});
const preflight={
  at:new Date().toISOString(),
  deployerNonce:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[EXPECTED.deployer,'pending']))),
  deployerBalanceWei:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[EXPECTED.deployer,'latest']))),
  paymasterCode:await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[EXPECTED.paymaster,'latest']),
  gasPriceWei:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_gasPrice'))),
};
if(!['4','5'].includes(preflight.deployerNonce))throw Error(`PRECONDITION_DRIFT ${JSON.stringify(preflight)}`);
if(BigInt(preflight.deployerBalanceWei)<BigInt(plan.deployment.maximumDeployerDebitWei))throw Error('INSUFFICIENT_DEPLOYER_BALANCE');
console.log(JSON.stringify({phase:'preflight',...preflight}));

const evidence={schema:'framefuzz.uniswap-live.v1',sourceDigest:EXPECTED.source,plan,preflight,approvedIdentities:EXPECTED,steps:{},writes:[]};
let deployReceipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[EXPECTED.deploy]);
if(!deployReceipt){
 const submittedDeploy=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[setup.deployment.raw]);
 if(submittedDeploy.toLowerCase()!==EXPECTED.deploy.toLowerCase())throw Error(`DEPLOY_HASH_MISMATCH ${submittedDeploy}`);
 evidence.writes.push({at:new Date().toISOString(),kind:'DEPLOY',hash:submittedDeploy});
 deployReceipt=await waitReceipt(EXPECTED.deploy);
}
if(deployReceipt.status!=='0x1'||deployReceipt.contractAddress?.toLowerCase()!==EXPECTED.paymaster.toLowerCase())throw Error(`DEPLOY_FAILED ${JSON.stringify(deployReceipt)}`);
const runtime=await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[EXPECTED.paymaster,'latest']);
const runtimeHash=keccak256(runtime);
if(runtimeHash!==EXPECTED.runtime)throw Error(`RUNTIME_HASH_MISMATCH ${runtimeHash}`);
evidence.steps.deployment={hash:EXPECTED.deploy,receipt:deployReceipt,runtimeHash,runtimeBytes:(runtime.length-2)/2};
console.log(JSON.stringify({phase:'deployment',hash:EXPECTED.deploy,block:deployReceipt.blockNumber,runtimeHash}));

const submittedStake=await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[stakePayload.wire]);
if(submittedStake.toLowerCase()!==stakePayload.hash.toLowerCase())throw Error(`STAKE_HASH_MISMATCH ${submittedStake}`);
evidence.writes.push({at:new Date().toISOString(),kind:'STAKE',hash:submittedStake});
const stakeReceipt=await waitReceipt(stakePayload.hash);
if(stakeReceipt.status!=='0x1')throw Error(`STAKE_FAILED ${JSON.stringify(stakeReceipt)}`);
const stake=await depositInfo(EXPECTED.paymaster);
if(BigInt(stake.amountWei)<10_000_000_000_000_000n||stake.unstakeDelay!==86400||stake.withdrawTime!==0)throw Error(`STAKE_STATE_MISMATCH ${JSON.stringify(stake)}`);
evidence.steps.stake={hash:stakePayload.hash,nonce:stakePayload.nonce,receipt:stakeReceipt,depositInfo:stake,supersedes:refreshedStake?.supersedes??null};
console.log(JSON.stringify({phase:'stake',hash:stakePayload.hash,block:stakeReceipt.blockNumber,stake}));

const comparison=await comparePolicyCandidate({
  candidate:{...candidate,wallet:candidate.sender},
  simulateCanonical:async raw=>rpc(EF_CANONICAL_ENDPOINT,'eth_callFrameTransaction',[raw]),
  submitCanonical:async raw=>{evidence.writes.push({at:new Date().toISOString(),kind:'CANONICAL_ADMISSION',hash:EXPECTED.candidate});return rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[raw]);},
  submitAlternative:async wire=>{evidence.writes.push({at:new Date().toISOString(),kind:'ALTERNATIVE_ADMISSION',hash:EXPECTED.candidate});return rpc(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[wire]);},
  readState:async()=>({pendingNonce:String(Number(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.sender,'pending']))))}),
  readCanonicalReceipt:async hash=>rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]),
  readAlternativeReport:async hash=>rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[hash]),
});
let inclusion=null;
for(let i=0;i<8&&!inclusion;i++){inclusion=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[EXPECTED.candidate]);if(!inclusion)await sleep(2000);}
evidence.steps.comparison={observedAt:new Date().toISOString(),comparison,inclusion};
evidence.completedAt=new Date().toISOString();
const serialized=JSON.stringify(evidence,null,2)+'\n';
await mkdir('evidence/live/2026-11-07',{recursive:true});
await writeFile('evidence/live/2026-11-07/uniswap-final-live.json',serialized,{flag:'wx'});
await writeFile('evidence/live/2026-11-07/uniswap-final-live.sha256',createHash('sha256').update(serialized).digest('hex')+'\n',{flag:'wx'});
console.log(JSON.stringify({phase:'done',deployment:EXPECTED.deploy,stake:stakePayload.hash,candidate:EXPECTED.candidate,canonical:comparison.canonical,alternative:comparison.alternative,divergence:comparison.divergence,inclusion},null,2));
