#!/usr/bin/env node
/** Read-only cost/address preparation. Never signs or submits. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {encodeDeployData,getContractAddress,keccak256} from 'viem';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';

const SENDER='0x366E6203603C39Eec1e75b3be6f078911447f235';
const STATE_VIEW='0xd89a052862AaA34f0B6cc7f3B6a9D080584a43FB';
const POOL_ID='0x784bd7879f8155eda79b7834d53c2f19ace60aed221fe33ef03ce660eff60648';
const REGISTRY='0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f';
const source=await readFile('vendor/paymaster/ReserveReadingPaymaster.sol');
const artifact=JSON.parse(await readFile('artifacts/step2e/ReserveReadingPaymaster.json','utf8'));
const creationData=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[STATE_VIEW,POOL_ID]});
const [canonicalChain,alternativeChain,canonicalClient,alternativeClient,balance,nonce,gasPrice,stateViewCode,registryCode,sidecarInfo,sidecarConfig,simulatedRuntime]=await Promise.all([
 rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion'),rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[SENDER,'latest']),rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[SENDER,'pending']),rpc(EF_CANONICAL_ENDPOINT,'eth_gasPrice'),rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[STATE_VIEW,'latest']),rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[REGISTRY,'latest']),rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config'),rpc(EF_CANONICAL_ENDPOINT,'eth_call',[{from:SENDER,data:creationData,value:'0x0'},'latest']),
]);
const routing=assertEfRouting({canonical:{chainId:canonicalChain,clientVersion:canonicalClient},alternative:{chainId:alternativeChain,clientVersion:alternativeClient,skandhaInfo:sidecarInfo,skandhaConfig:sidecarConfig}});
if(stateViewCode==='0x'||registryCode==='0x')throw Error('Live setup prerequisites changed');
const deployerNonce=BigInt(nonce);
const creationValue=13_000_000_000_000_000n; // 0.013: 0.01 stake + two bounded 0.0015 gas reserves.
const estimate=BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_estimateGas',[{from:SENDER,data:creationData,value:`0x${creationValue.toString(16)}`}])) ;
const deploymentGasLimit=(estimate*125n+99n)/100n;
const maxFeePerGas=3_000_000_000n;
const deploymentGasCeiling=deploymentGasLimit*maxFeePerGas;
const deployerRequired=creationValue+deploymentGasCeiling;
const topUpRequired=deployerRequired>BigInt(balance)?deployerRequired-BigInt(balance):0n;
const stakeValue=10_000_000_000_000_000n,stakeGasCeiling=1_500_000_000_000_000n,candidateGasCeiling=1_500_000_000_000_000n;
const overallSpendCeiling=deploymentGasCeiling+stakeValue+stakeGasCeiling+candidateGasCeiling;
const predictedContract=getContractAddress({from:SENDER,nonce:deployerNonce});
const predictedCode=await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[predictedContract,'latest']);
if(predictedCode!=='0x')throw Error(`Predicted deployment address is occupied: ${predictedContract}`);
const plan={schema:'framefuzz.policy-experiment-plan.v1',classification:'PREPARED_BLOCKED_WRITES',generatedAt:new Date().toISOString(),chainId:1337,source:{path:'vendor/paymaster/ReserveReadingPaymaster.sol',sha256:createHash('sha256').update(source).digest('hex'),artifactPath:'artifacts/step2e/ReserveReadingPaymaster.json',compiler:artifact.compiler,settings:artifact.settings,creationBytecodeBytes:(artifact.bytecode.length-2)/2,creationBytecodeHash:keccak256(artifact.bytecode),creationDataHash:keccak256(creationData),expectedRuntimeHash:keccak256(simulatedRuntime),expectedRuntimeBytes:(simulatedRuntime.length-2)/2},bindings:{stateView:STATE_VIEW,stateViewCodeHash:keccak256(stateViewCode),poolId:POOL_ID,stakingRegistry:REGISTRY},routing,deployer:{address:SENDER,pendingNonce:String(deployerNonce),balanceWei:String(BigInt(balance)),predictedContract,predictedContractCode:'EMPTY'},deployment:{creationValueWei:String(creationValue),estimatedGas:String(estimate),gasLimit:String(deploymentGasLimit),maxFeePerGasWei:String(maxFeePerGas),maximumGasFeeWei:String(deploymentGasCeiling),maximumDeployerDebitWei:String(deployerRequired),minimumTopUpWei:String(topUpRequired)},stake:{amountWei:String(stakeValue),unstakeDelaySeconds:86400,maximumGasFeeWei:String(stakeGasCeiling)},candidate:{mutation:'PAYMENT VERIFY calldata 0x01 performs StateView.getSlot0(poolId)',canonicalExpected:'REJECTED_POLICY StorageReadNonSender',alternativeExpected:'ACCEPTED after stake',maximumGasFeeWei:String(candidateGasCeiling),protocol:'canonical rejection first; alternative only after unchanged nonce and null receipt'},maximumOverallTestnetSpendWei:String(overallSpendCeiling),fixedOperatorCeilingWei:'26087377000000000',fundingTransferRequired:topUpRequired>0n,writes:0,broadcasts:0};
if(overallSpendCeiling>26_087_377_000_000_000n)throw Error('Refusing to exceed fixed operator ceiling');
await mkdir('runs',{recursive:true});await writeFile('runs/final-uniswap-preflight.json',JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify(plan,null,2));
