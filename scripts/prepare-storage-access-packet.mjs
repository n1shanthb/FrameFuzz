#!/usr/bin/env node
/** Read-only preparation of the workshop storage-access live divergence packet. No writes. */
import {createHash} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {analyzeContract} from '../src/playground/compile.mjs';
import {liveAdmissionReadiness} from '../src/playground/live-admission.mjs';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';
import {STAKING_REGISTRY,STAKE_WEI,WALLET_FUNDING_WEI} from '../src/adapters/wallet-codec.mjs';

const SOURCE=await readFile(new URL('../examples/contracts/StorageAccessValidator.sol',import.meta.url),'utf8');
const SENDER=process.env.FRAMEFUZZ_SENDER||'0x366E6203603C39Eec1e75b3be6f078911447f235';
const analysis=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
const readiness=await liveAdmissionReadiness(analysis);
const [bal,nonce,gas,head]=await Promise.all([
  rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[SENDER,'latest']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[SENDER,'pending']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_gasPrice'),
  rpc(EF_CANONICAL_ENDPOINT,'eth_blockNumber'),
]);
const balanceWei=BigInt(bal);
const deployGasLimit=6_000_000n; // workshop deployGasLimit
const maxFee=3_000_000_000n; // 3 gwei ceiling
const foreignDeployMax=deployGasLimit*maxFee;
const walletDeployMax=deployGasLimit*maxFee+WALLET_FUNDING_WEI;
const stakeMax=150_000n*maxFee+STAKE_WEI;
const policyMax=250_000n*maxFee;
const setupNeed=foreignDeployMax+walletDeployMax+stakeMax+policyMax;
const topUp=setupNeed>balanceWei?setupNeed-balanceWei:0n;
const packet={
  schema:'framefuzz.storage-access-approval.v1',
  observedAt:new Date().toISOString(),
  writes:0,
  broadcasts:0,
  capability:'STORAGE_ACCESS_VALIDATOR_V1',
  reference:'https://docs.altmempool.wtf/guides/quickstart/ steps 4/6/7/8',
  source:{
    file:'examples/contracts/StorageAccessValidator.sol',
    contractName:'ViolatingWallet',
    companion:'Foreign',
    sourceDigest:analysis.sourceDigest,
    analysisId:analysis.analysisId,
    runtimeBytecodeHash:analysis.runtimeBytecodeHash,
    creationBytecodeHash:analysis.creationBytecodeHash,
    detectedRole:analysis.detectedRole,
  },
  endpoints:{
    canonical:{url:EF_CANONICAL_ENDPOINT,role:'CANONICAL_EXECUTION',...readiness.canonical},
    alternative:{url:EF_ALTERNATIVE_ENDPOINT,role:'ALTERNATIVE_SIDECAR',...readiness.alternative},
  },
  chain:{id:1337,head:Number(BigInt(head)),gasPriceWei:String(BigInt(gas)),stakingRegistry:STAKING_REGISTRY},
  operatorSender:{
    address:SENDER,
    balanceWei:String(balanceWei),
    pendingNonce:Number(BigInt(nonce)),
    codeEmpty:true,
    note:'Current balance is insufficient for Foreign+ViolatingWallet deploy+stake; top-up required before approved writes.',
  },
  minimumTransactionSequence:[
    {step:1,action:'FUND_OPERATOR_EOA',valueWei:String(topUp),purpose:'Cover two contract creations, 0.03 wallet funding, 0.012 stake, and gas'},
    {step:2,action:'DEPLOY_FOREIGN',contract:'Foreign',valueWei:'0'},
    {step:3,action:'DEPLOY_VIOLATING_WALLET',contract:'ViolatingWallet',constructor:['owner','foreign'],valueWei:String(WALLET_FUNDING_WEI)},
    {step:4,action:'VERIFY_RUNTIME_HASH',expected:analysis.runtimeBytecodeHash},
    {step:5,action:'STAKE_WALLET',registry:STAKING_REGISTRY,stakeWei:String(STAKE_WEI),unstakeDelaySec:86400,path:'frame VERIFY(clean)+SENDER(addStake)'},
    {step:6,action:'SIGN_POLICY_CANDIDATE',verifyData:'0x01',sameIdentityBothPaths:true},
    {step:7,action:'SUBMIT_CANONICAL_FIRST',method:'eth_sendRawTransaction',expect:'StorageReadNonSender'},
    {step:8,action:'CONFIRM_NONCE_UNCHANGED_NULL_RECEIPT'},
    {step:9,action:'SUBMIT_ALTERNATIVE',method:'eth_sendFrameTransaction',expect:'accepted when staked'},
    {step:10,action:'QUERY_INCLUSION_AND_SIDECAR_REPORT'},
  ],
  costs:{
    maxTestEthExposureWei:String(setupNeed),
    maxTestEthExposureEth:Number(setupNeed)/1e18,
    requiredTopUpWei:String(topUp),
    requiredTopUpEth:Number(topUp)/1e18,
    stakeLockedWei:String(STAKE_WEI),
    walletCreationFundingWei:String(WALLET_FUNDING_WEI),
    gasPriceCeilingWei:String(maxFee),
  },
  readiness,
  recordingWorkflow:[
    'Serve with --mode LIVE_AUTHORIZED and FRAMEFUZZ_OWNER_KEY on an operator-only host (not public judges).',
    'Paste examples/contracts/StorageAccessValidator.sol, select ViolatingWallet, Analyze.',
    'After approved setup writes, enter wallet/foreign/owner addresses and Refresh live readiness.',
    'Prepare fresh admission experiment → confirm exact hash → Run Live Comparison.',
    'Table must show REJECTED_POLICY vs ACCEPTED with LIVE provenance and sidecar admission id.',
  ],
  approvalStatus:'AWAITING_EXPLICIT_USER_APPROVAL',
  hardStops:['No automatic writes from this packet','No OpenRouter spend','No Uniswap/Arkiv/Swarm work','No historical rows in the live table'],
};
const dir=path.join('evidence','prepared','2026-11-07');
await mkdir(dir,{recursive:true});
const file=path.join(dir,'storage-access-approval-packet.json');
const body=JSON.stringify(packet,null,2)+'\n';
await writeFile(file,body);
const digest=createHash('sha256').update(body).digest('hex');
await writeFile(path.join(dir,'storage-access-approval-packet.sha256'),digest+'\n');
console.log(JSON.stringify({file,sha256:digest,topUpEth:packet.costs.requiredTopUpEth,runtimeBytecodeHash:analysis.runtimeBytecodeHash,classification:readiness.classification,writes:0},null,2));
