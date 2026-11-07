#!/usr/bin/env node
/** Offline signing only. The ephemeral key is never returned or persisted. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {keccak256} from 'viem';
import {buildSponsored} from '../src/adapters/workshop-codec.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const plan=JSON.parse(await readFile('runs/final-uniswap-preflight.json','utf8'));
const privateKey=generatePrivateKey(),sender=privateKeyToAccount(privateKey).address;
const built=await buildSponsored({sender,payer:plan.deployer.predictedContract,recipient:'0x8943545177806ED17B9F23F0a21ee5948eCaa776',nonce:0,chainId:1337,privateKey,poolRead:true,verificationGas:50000,maxFeePerGas:3000000000n});
if(keccak256(built.raw)!==built.hash)throw Error('Candidate identity mismatch');
const candidate={schema:'framefuzz.policy-candidate.v1',classification:'OFFLINE_SIGNED_BLOCKED_SETUP',source:plan.source,mutation:{family:'validation-storage-read',description:'ReserveReadingPaymaster PAYMENT VERIFY calldata 0x01 calls StateView.getSlot0(poolId)',calldata:'0x01'},bindings:{...plan.bindings,paymaster:plan.deployer.predictedContract,expectedPaymasterRuntimeHash:plan.source.expectedRuntimeHash},sender,payer:plan.deployer.predictedContract,nonce:'0',hash:built.hash,raw:built.raw,wire:built.wire,fee:{maxFeePerGasWei:'3000000000',maximumGasUnits:'500000',maximumSenderOrPayerSpendWei:'1500000000000000'},requests:{canonical:{endpoint:EF_CANONICAL_ENDPOINT,method:'eth_sendRawTransaction',params:[built.raw]},alternative:{endpoint:EF_ALTERNATIVE_ENDPOINT,method:'eth_sendFrameTransaction',params:[built.wire]}},predictions:{canonical:{status:'REJECTED_POLICY',rule:'StorageReadNonSender'},alternative:{status:'ACCEPTED',precondition:'Paymaster runtime/stake/funding bindings verified'}},broadcasts:0,writes:0};
await mkdir('evidence/prepared/2026-11-07',{recursive:true});
await writeFile('evidence/prepared/2026-11-07/final-uniswap-policy-candidate.json',JSON.stringify(candidate,null,2)+'\n');
console.log(JSON.stringify({hash:candidate.hash,sender:candidate.sender,payer:candidate.payer,sourceDigest:candidate.source.sha256,mutation:candidate.mutation,fee:candidate.fee,requests:{canonical:{endpoint:candidate.requests.canonical.endpoint,method:candidate.requests.canonical.method},alternative:{endpoint:candidate.requests.alternative.endpoint,method:candidate.requests.alternative.method}},writes:0,broadcasts:0},null,2));
