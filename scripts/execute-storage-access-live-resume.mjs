/** Resume approved storage-access live sequence after successful Foreign+ViolatingWallet deploy. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {analyzeContract} from '../src/playground/compile.mjs';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';
import {buildStakeTransaction,signWalletCandidate,STAKE_WEI,UNSTAKE_DELAY_SEC,STAKING_REGISTRY} from '../src/adapters/wallet-codec.mjs';
import {liveAdmissionReadiness,runLiveComparison,runtimeMatchesTemplate} from '../src/playground/live-admission.mjs';
import {signTx,encodeTx,txHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {profile} from '../src/adapters/workshop-codec.mjs';

const PACKET_SHA='6c55073e8f579b86eb58a515fb690fa6165e43c223c5c7388ed909fb40a0a6b4';
const EXPECTED_RUNTIME='0xa0b282997f1eacc54f302d398988e4cae8124b9fc8fd0ca3c2e2f21d326ec1ea';
const EXPECTED_SOURCE='05e4454685fa6755f0d691a382a47b8a2f941458ea075d58e823c75e2e1f6959';
const EXPECTED_ANALYSIS='845042822fed6d5debf3513348fcb37d9d59915be093babeb995dcaf1adace3f';
const FEE=2_000_000_000n;
const WALLET='0x6b7206fa6fc5fe541061bdedf2c6a2bbf4cf8199';
const FOREIGN='0x6d5bed568904290fca0b8d4e99bed2a7f9d44145';
const FOREIGN_TX='0xb1703856dfb91ff894fae18ef6b69db41a28e809f088e98fc7322fddc6f3e81c';
const WALLET_TX='0xa30017366a7cfcc86a1618a59d20118135617fa23e41a5c0c1fb21a52d77e744';
const FAUCET_TX='0xac29dccb9ced4c59b7f8f319c60a21fc78192bbd5fdcf4f87b632439cf2e0cfc';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitReceipt(hash,{timeoutMs=120_000}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    const r=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);
    if(r)return r;
    await sleep(2000);
  }
  throw Error('TX_NOT_MINED '+hash);
}

const key=process.env.FRAMEFUZZ_OWNER_KEY||process.env.FRAMEFUZZ_SENDER_KEY;
if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key))throw Error('owner/sender key required');
const account=privateKeyToAccount(key);
const owner=account.address;
if(owner.toLowerCase()!=='0x366e6203603c39eec1e75b3be6f078911447f235')throw Error('operator drift');

const packetRaw=await readFile('evidence/prepared/2026-11-07/storage-access-approval-packet.json');
if(createHash('sha256').update(packetRaw).digest('hex')!==PACKET_SHA)throw Error('PACKET_DIGEST_DRIFT');

const SOURCE=await readFile('examples/contracts/StorageAccessValidator.sol','utf8');
const walletAnalysis=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
if(walletAnalysis.sourceDigest!==EXPECTED_SOURCE||walletAnalysis.analysisId!==EXPECTED_ANALYSIS||walletAnalysis.runtimeBytecodeHash!==EXPECTED_RUNTIME)throw Error('SOURCE_BINDING_DRIFT');

assertEfRouting({
  canonical:{chainId:await rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion')},
  alternative:{chainId:await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),skandhaInfo:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),skandhaConfig:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config')},
});

const code=await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[WALLET,'latest']);
const codeHash=keccak256(code);
const exact=codeHash===EXPECTED_RUNTIME;
const bound=exact||runtimeMatchesTemplate(code,walletAnalysis.runtimeBytecode,walletAnalysis.immutableReferences);
if(!bound)throw Error('RUNTIME_ONCHAIN_MISMATCH '+codeHash);

const evidence={
  schema:'framefuzz.storage-access-live.v1',
  packetSha256:PACKET_SHA,
  observedAt:new Date().toISOString(),
  operator:owner,
  funding:{method:'skandha_explorer_faucet',amountWei:'1000000000000000000',txHash:FAUCET_TX},
  steps:{
    deployForeign:{hash:FOREIGN_TX,address:FOREIGN,nonce:2,gasPriceWei:'2000000000'},
    deployWallet:{hash:WALLET_TX,address:WALLET,nonce:3,valueWei:'30000000000000000',gasPriceWei:'2000000000'},
    verifyRuntime:{wallet:WALLET,foreign:FOREIGN,codeHash,templateHash:EXPECTED_RUNTIME,boundMode:exact?'EXACT_HASH':'IMMUTABLE_SLOTS',ok:true},
  },
};

console.log(JSON.stringify({phase:'verifyRuntime',...evidence.steps.verifyRuntime}));

const walletNonce=Number(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[WALLET,'pending']));
const unsignedStake=buildStakeTransaction({wallet:WALLET,owner,nonce:walletNonce,maxFeePerGas:FEE});
const signedStake=await signTx(profile,unsignedStake,key);
const stakeRaw=encodeTx(profile,signedStake);
const stakeHash=txHash(profile,signedStake);
console.log(JSON.stringify({phase:'stakeSubmit',stakeHash,walletNonce}));
const stakeSubmit=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[stakeRaw]);
if(stakeSubmit.toLowerCase()!==stakeHash.toLowerCase())throw Error('STAKE_HASH_MISMATCH '+stakeSubmit);
const stakeReceipt=await waitReceipt(stakeHash);
if(stakeReceipt.status!=='0x1')throw Error('STAKE_REVERTED '+stakeHash);

const readinessAfterStake=await liveAdmissionReadiness(walletAnalysis,{wallet:WALLET,foreign:FOREIGN,owner});
evidence.steps.stake={hash:stakeHash,amountWei:String(STAKE_WEI),unstakeDelaySec:UNSTAKE_DELAY_SEC,registry:STAKING_REGISTRY,walletNonce,status:readinessAfterStake.stake,receiptStatus:stakeReceipt.status};
console.log(JSON.stringify({phase:'stake',hash:stakeHash,stake:readinessAfterStake.stake,classification:readinessAfterStake.classification,blockers:readinessAfterStake.blockers}));
if(readinessAfterStake.classification!=='READY_FOR_LIVE_COMPARISON')throw Error('NOT_READY_AFTER_STAKE: '+(readinessAfterStake.blockers||[]).join(' · '));

const candidate=await signWalletCandidate({
  privateKey:key,wallet:WALLET,owner,nonce:readinessAfterStake.nonce,verifyData:'0x01',
  sourceDigest:walletAnalysis.sourceDigest,analysisId:walletAnalysis.analysisId,
  mutation:'ViolatingWallet VERIFY data triggers FOREIGN.staticcall (StorageReadNonSender vs staked alt admit)',
});
evidence.steps.candidate={hash:candidate.hash,nonce:candidate.nonce,verifyData:candidate.verifyData,wallet:candidate.wallet};
console.log(JSON.stringify({phase:'candidate',hash:candidate.hash,nonce:candidate.nonce}));

const comparison=await runLiveComparison({candidate,authorizeWrites:true});
evidence.steps.comparison={
  transactionIdentity:comparison.transactionIdentity,
  divergence:comparison.divergence,
  canonical:comparison.canonical,
  alternative:comparison.alternative,
  alternativeReport:comparison.alternativeReport,
  inclusion:comparison.inclusion,
  table:comparison.table,
  provenance:comparison.provenance,
};
console.log(JSON.stringify({
  phase:'comparison',
  divergence:comparison.divergence,
  canonical:comparison.canonical?.status,
  alternative:comparison.alternative?.status,
  rule:comparison.canonical?.message??comparison.canonical?.error??null,
  inclusionBlock:comparison.inclusion?.blockNumber??null,
  sidecarAdmissionId:comparison.table?.[0]?.evidence?.sidecarAdmissionId??null,
},null,2));

evidence.completedAt=new Date().toISOString();
evidence.writes=4;
evidence.broadcasts=['deployForeign','deployWallet','stake','policyCandidate'];
const outDir=path.join('evidence','live','2026-11-07');
await mkdir(outDir,{recursive:true});
const body=JSON.stringify(evidence,null,2)+'\n';
await writeFile(path.join(outDir,'storage-access-live.json'),body);
await writeFile(path.join(outDir,'storage-access-live.sha256'),createHash('sha256').update(body).digest('hex')+'\n');
console.log(JSON.stringify({phase:'done',evidence:path.join(outDir,'storage-access-live.json'),divergence:comparison.divergence,table:comparison.table},null,2));
