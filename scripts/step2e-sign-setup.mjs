#!/usr/bin/env node
/** Offline signing only for the exact deployment and stake setup. No RPC transport. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {privateKeyToAccount} from 'viem/accounts';
import {encodeDeployData,encodeFunctionData,keccak256} from 'viem';
import * as lib from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {profile} from '../src/adapters/workshop-codec.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing from ignored local environment');
const account=privateKeyToAccount(key),plan=JSON.parse(await readFile('runs/final-uniswap-preflight.json','utf8')),artifact=JSON.parse(await readFile(plan.source.artifactPath,'utf8'));
if(account.address.toLowerCase()!==plan.deployer.address.toLowerCase())throw Error('Deployer identity mismatch');
const deploymentNonce=BigInt(plan.deployer.pendingNonce);
const creationData=encodeDeployData({abi:artifact.abi,bytecode:artifact.bytecode,args:[plan.bindings.stateView,plan.bindings.poolId]});
if(keccak256(creationData)!==plan.source.creationDataHash)throw Error('Creation data changed');
const deploymentRaw=await account.signTransaction({chainId:1337,nonce:deploymentNonce,data:creationData,value:BigInt(plan.deployment.creationValueWei),gas:BigInt(plan.deployment.gasLimit),gasPrice:BigInt(plan.deployment.maxFeePerGasWei),type:'legacy'});
const addStake=encodeFunctionData({abi:[{type:'function',name:'addStake',stateMutability:'payable',inputs:[{type:'uint32'}],outputs:[]}],functionName:'addStake',args:[86400]});
const unsigned=lib.newTx({chainId:1337,sender:plan.deployer.predictedContract,nonceSeq:0n,frames:[lib.frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:80000n,data:'0x02'}),lib.frame(profile,'SENDER',{target:plan.bindings.stakingRegistry,execution:150000n,state:300000n,value:BigInt(plan.stake.amountWei),data:addStake})],signatures:[lib.secp256k1Placeholder(profile,account.address)],fees:{maxFeePerGas:3000000000n}});
const stakeSigned=await lib.signTx(profile,unsigned,key),stakeRaw=lib.encodeTx(profile,stakeSigned),stakeHash=lib.txHash(profile,stakeSigned);
const output={schema:'framefuzz.policy-setup-signed.v1',classification:'OFFLINE_SIGNED_NOT_SUBMITTED',deployer:account.address,predictedContract:plan.deployer.predictedContract,deployment:{hash:keccak256(deploymentRaw),raw:deploymentRaw,request:{endpoint:EF_CANONICAL_ENDPOINT,method:'eth_sendRawTransaction',params:[deploymentRaw]},nonce:Number(deploymentNonce),valueWei:plan.deployment.creationValueWei,gasLimit:plan.deployment.gasLimit,gasPriceWei:plan.deployment.maxFeePerGasWei,creationDataHash:plan.source.creationDataHash,expectedRuntimeHash:plan.source.expectedRuntimeHash},stake:{hash:stakeHash,raw:stakeRaw,wire:toWire(stakeSigned),request:{endpoint:EF_ALTERNATIVE_ENDPOINT,method:'eth_sendFrameTransaction',params:[toWire(stakeSigned)]},sender:plan.deployer.predictedContract,nonce:'0',amountWei:plan.stake.amountWei,unstakeDelaySeconds:86400,maximumGasFeeWei:plan.stake.maximumGasFeeWei},writes:0,broadcasts:0};
await mkdir('evidence/prepared/2026-11-07',{recursive:true});await writeFile('evidence/prepared/2026-11-07/final-uniswap-setup-signed.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({deployer:output.deployer,predictedContract:output.predictedContract,deployment:{hash:output.deployment.hash,nonce:Number(deploymentNonce),valueWei:output.deployment.valueWei,maximumGasFeeWei:plan.deployment.maximumGasFeeWei},stake:{hash:output.stake.hash,nonce:'0',amountWei:output.stake.amountWei,maximumGasFeeWei:output.stake.maximumGasFeeWei},writes:0,broadcasts:0},null,2));
