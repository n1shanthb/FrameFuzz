#!/usr/bin/env node
/** Re-sign identical approved stake semantics at the live paymaster nonce. */
import {readFile,writeFile} from 'node:fs/promises';
import {encodeFunctionData} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import * as lib from '@forshtat/hegota-support/tx';
import {toWire} from '@forshtat/hegota-support/rpc';
import {profile} from '../src/adapters/workshop-codec.mjs';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing');
const account=privateKeyToAccount(key);
const plan=JSON.parse(await readFile('runs/final-uniswap-preflight.json','utf8'));
if(account.address.toLowerCase()!==plan.deployer.address.toLowerCase())throw Error('OWNER_DRIFT');
const sender=plan.deployer.predictedContract;
const nonce=BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[sender,'pending']));
const addStake=encodeFunctionData({abi:[{type:'function',name:'addStake',stateMutability:'payable',inputs:[{type:'uint32'}],outputs:[]}],functionName:'addStake',args:[86400]});
const unsigned=lib.newTx({chainId:1337,sender,nonceSeq:nonce,frames:[lib.frame(profile,'VERIFY',{scope:'EXECUTION_AND_PAYMENT',target:null,execution:80000n,data:'0x02'}),lib.frame(profile,'SENDER',{target:plan.bindings.stakingRegistry,execution:150000n,state:300000n,value:BigInt(plan.stake.amountWei),data:addStake})],signatures:[lib.secp256k1Placeholder(profile,account.address)],fees:{maxFeePerGas:3000000000n}});
const signed=await lib.signTx(profile,unsigned,key);
const output={schema:'framefuzz.policy-stake-resigned.v1',classification:'OFFLINE_SIGNED_NOT_SUBMITTED',reason:'Original nonce-0 stake rejected pre-admission; live newly deployed paymaster nonce is protocol nonce 8',supersedes:'0x1c9495f21d67ee1ee83fc69b19ea7564d6b0fe8b66f5766fba5e2e33b41ba2b8',sender,nonce:String(nonce),hash:lib.txHash(profile,signed),raw:lib.encodeTx(profile,signed),wire:toWire(signed),request:{endpoint:EF_ALTERNATIVE_ENDPOINT,method:'eth_sendFrameTransaction'},amountWei:plan.stake.amountWei,unstakeDelaySeconds:86400,writes:0,broadcasts:0};
await writeFile('evidence/prepared/2026-11-07/final-uniswap-stake-resigned.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({hash:output.hash,sender,nonce:output.nonce,amountWei:output.amountWei,writes:0,broadcasts:0},null,2));
