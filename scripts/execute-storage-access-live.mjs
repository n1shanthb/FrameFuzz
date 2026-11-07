/** Approved storage-access live sequence: fund (already done) → deploy → stake → rejection-first compare. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {encodeDeployData,keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {analyzeContract} from '../src/playground/compile.mjs';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';
import {buildStakeTransaction,signWalletCandidate,STAKE_WEI,UNSTAKE_DELAY_SEC,WALLET_FUNDING_WEI,STAKING_REGISTRY} from '../src/adapters/wallet-codec.mjs';
import {liveAdmissionReadiness,runLiveComparison,runtimeMatchesTemplate} from '../src/playground/live-admission.mjs';
import {signTx,encodeTx,txHash} from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {profile} from '../src/adapters/workshop-codec.mjs';

const PACKET_SHA='6c55073e8f579b86eb58a515fb690fa6165e43c223c5c7388ed909fb40a0a6b4';
const EXPECTED_RUNTIME='0xa0b282997f1eacc54f302d398988e4cae8124b9fc8fd0ca3c2e2f21d326ec1ea';
const EXPECTED_CREATION='0x1005237c323c3dfefe4f7304fe0aee2f9b342eaa10b1c330196789c25149cf13';
const EXPECTED_SOURCE='05e4454685fa6755f0d691a382a47b8a2f941458ea075d58e823c75e2e1f6959';
const EXPECTED_ANALYSIS='845042822fed6d5debf3513348fcb37d9d59915be093babeb995dcaf1adace3f';
const DEPLOY_GAS=6_000_000n;
const GAS_CEILING=3_000_000_000n;
const FEE=2_000_000_000n;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=e=>String(e?.message??e).slice(0,300);

async function waitReceipt(hash,{timeoutMs=120_000}={}){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    const r=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);
    if(r)return r;
    await sleep(2000);
  }
  throw Error('TX_NOT_MINED '+hash);
}

async function sendLegacy({account,key,nonce,data,value=0n}){
  const gasPrice=BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_gasPrice'));
  if(gasPrice>GAS_CEILING)throw Error(`GAS_DRIFT gasPrice ${gasPrice} > ceiling ${GAS_CEILING}`);
  const raw=await account.signTransaction({
    chainId:1337,type:'legacy',nonce,to:null,data,value,gas:DEPLOY_GAS,gasPrice:gasPrice>FEE?gasPrice:FEE,
  });
  const hash=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[raw]);
  const receipt=await waitReceipt(hash);
  if(receipt.status!=='0x1'||!receipt.contractAddress)throw Error(`DEPLOY_REVERTED ${hash}`);
  return {hash,receipt,address:receipt.contractAddress,gasPrice:String(gasPrice>FEE?gasPrice:FEE),nonce};
}

const key=process.env.FRAMEFUZZ_OWNER_KEY||process.env.FRAMEFUZZ_SENDER_KEY;
if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key))throw Error('FRAMEFUZZ_OWNER_KEY or FRAMEFUZZ_SENDER_KEY required');
const account=privateKeyToAccount(key);
const owner=account.address;
if(owner.toLowerCase()!=='0x366e6203603c39eec1e75b3be6f078911447f235')throw Error('Operator sender identity drift: '+owner);

const packetPath='evidence/prepared/2026-11-07/storage-access-approval-packet.json';
const packetRaw=await readFile(packetPath);
const packetDigest=createHash('sha256').update(packetRaw).digest('hex');
if(packetDigest!==PACKET_SHA)throw Error(`PACKET_DIGEST_DRIFT ${packetDigest}`);

const SOURCE=await readFile('examples/contracts/StorageAccessValidator.sol','utf8');
const foreignAnalysis=await analyzeContract({source:SOURCE,contractName:'Foreign'});
const walletAnalysis=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
if(walletAnalysis.status!=='READY')throw Error('Wallet analysis not READY');
if(walletAnalysis.sourceDigest!==EXPECTED_SOURCE)throw Error('SOURCE_DIGEST_DRIFT');
if(walletAnalysis.analysisId!==EXPECTED_ANALYSIS)throw Error('ANALYSIS_ID_DRIFT');
if(walletAnalysis.runtimeBytecodeHash!==EXPECTED_RUNTIME)throw Error('RUNTIME_HASH_DRIFT');
if(walletAnalysis.creationBytecodeHash!==EXPECTED_CREATION)throw Error('CREATION_HASH_DRIFT');
if(foreignAnalysis.status!=='READY'||!foreignAnalysis.creationBytecode)throw Error('Foreign analysis failed');

assertEfRouting({
  canonical:{chainId:await rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion')},
  alternative:{chainId:await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),skandhaInfo:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),skandhaConfig:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config')},
});

const bal=BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[owner,'latest']));
let nonce=Number(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[owner,'pending']));
if(bal<80_000_000_000_000_000n)throw Error(`UNDERFUNDED ${bal}`);
if(nonce!==2)throw Error(`NONCE_DRIFT expected 2 got ${nonce} — replacement packet required`);

const evidence={
  schema:'framefuzz.storage-access-live.v1',
  packetSha256:PACKET_SHA,
  observedAt:new Date().toISOString(),
  operator:owner,
  funding:{method:'skandha_explorer_faucet',amountWei:'1000000000000000000',txHash:process.env.FAUCET_TX||'0xac29dccb9ced4c59b7f8f319c60a21fc78192bbd5fdcf4f87b632439cf2e0cfc',balanceAfterWei:String(bal)},
  steps:{},
};

console.log(JSON.stringify({phase:'preflight',owner,nonce,bal:String(bal),packetSha256:PACKET_SHA}));

// Step 2: Deploy Foreign
const foreignDeploy=await sendLegacy({account,key,nonce,data:foreignAnalysis.creationBytecode,value:0n});
evidence.steps.deployForeign={hash:foreignDeploy.hash,address:foreignDeploy.address,nonce:foreignDeploy.nonce,gasPriceWei:foreignDeploy.gasPrice};
nonce+=1;
console.log(JSON.stringify({phase:'deployForeign',...evidence.steps.deployForeign}));

// Step 3: Deploy ViolatingWallet
const creationData=encodeDeployData({
  abi:walletAnalysis.abi,
  bytecode:walletAnalysis.creationBytecode,
  args:[owner,foreignDeploy.address],
});
const walletDeploy=await sendLegacy({account,key,nonce,data:creationData,value:WALLET_FUNDING_WEI});
evidence.steps.deployWallet={hash:walletDeploy.hash,address:walletDeploy.address,nonce:walletDeploy.nonce,valueWei:String(WALLET_FUNDING_WEI),gasPriceWei:walletDeploy.gasPrice};
nonce+=1;
console.log(JSON.stringify({phase:'deployWallet',...evidence.steps.deployWallet}));

// Step 4: Verify runtime hash
const code=await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[walletDeploy.address,'latest']);
const codeHash=keccak256(code);
const exact=codeHash===EXPECTED_RUNTIME;
const bound=exact||runtimeMatchesTemplate(code,walletAnalysis.runtimeBytecode,walletAnalysis.immutableReferences);
if(!bound)throw Error(`RUNTIME_ONCHAIN_MISMATCH ${codeHash}`);
evidence.steps.verifyRuntime={wallet:walletDeploy.address,foreign:foreignDeploy.address,codeHash,templateHash:EXPECTED_RUNTIME,boundMode:exact?'EXACT_HASH':'IMMUTABLE_SLOTS',ok:true};
console.log(JSON.stringify({phase:'verifyRuntime',...evidence.steps.verifyRuntime}));

// Step 5: Stake wallet
const walletNonce=Number(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[walletDeploy.address,'pending']));
if(!Number.isSafeInteger(walletNonce)||walletNonce<0)throw Error(`WALLET_NONCE_INVALID ${walletNonce}`);
const unsignedStake=buildStakeTransaction({wallet:walletDeploy.address,owner,nonce:walletNonce,maxFeePerGas:FEE});
const signedStake=await signTx(profile,unsignedStake,key);
const stakeRaw=encodeTx(profile,signedStake);
const stakeWire=toWire(signedStake);
const stakeHash=txHash(profile,signedStake);
const stakeSubmit=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[stakeRaw]);
if(stakeSubmit.toLowerCase()!==stakeHash.toLowerCase())throw Error(`STAKE_HASH_MISMATCH ${stakeSubmit}`);
const stakeReceipt=await waitReceipt(stakeHash);
if(stakeReceipt.status!=='0x1')throw Error('STAKE_REVERTED '+stakeHash);
const readinessAfterStake=await liveAdmissionReadiness(walletAnalysis,{wallet:walletDeploy.address,foreign:foreignDeploy.address,owner});
evidence.steps.stake={hash:stakeHash,amountWei:String(STAKE_WEI),unstakeDelaySec:UNSTAKE_DELAY_SEC,registry:STAKING_REGISTRY,status:readinessAfterStake.stake,receiptStatus:stakeReceipt.status};
console.log(JSON.stringify({phase:'stake',hash:stakeHash,stake:readinessAfterStake.stake}));
if(readinessAfterStake.classification!=='READY_FOR_LIVE_COMPARISON'){
  throw Error('NOT_READY_AFTER_STAKE: '+(readinessAfterStake.blockers||[]).join(' · '));
}

// Steps 6–10: prepare + rejection-first compare
const candidate=await signWalletCandidate({
  privateKey:key,
  wallet:walletDeploy.address,
  owner,
  nonce:readinessAfterStake.nonce,
  verifyData:'0x01',
  sourceDigest:walletAnalysis.sourceDigest,
  analysisId:walletAnalysis.analysisId,
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
  inclusion:comparison.inclusion?.blockNumber??null,
  sidecarAdmissionId:comparison.table?.[0]?.evidence?.sidecarAdmissionId??null,
},null,2));

evidence.completedAt=new Date().toISOString();
evidence.writes=4;
evidence.broadcasts=['deployForeign','deployWallet','stake','policyCandidate'];

const outDir=path.join('evidence','live','2026-11-07');
await mkdir(outDir,{recursive:true});
const outFile=path.join(outDir,'storage-access-live.json');
await writeFile(outFile,JSON.stringify(evidence,null,2)+'\n');
await writeFile(path.join(outDir,'storage-access-live.sha256'),createHash('sha256').update(JSON.stringify(evidence)+'\n').digest('hex')+'\n');
console.log(JSON.stringify({phase:'done',evidence:outFile,divergence:comparison.divergence,table:comparison.table},null,2));
