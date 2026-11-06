#!/usr/bin/env node
/** Read-only EF preflight and offline signing. Never calls an RPC send method. */
import {mkdir,writeFile} from 'node:fs/promises';
import {privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../src/rpc.mjs';
import {prepareSelfRelayCandidate} from '../src/adapters/self-relay.mjs';
const publicRpc='https://altmempool.forshtat.com/rpc',alternative='https://altmempool.forshtat.com';
const methods=new Set(['eth_chainId','web3_clientVersion','eth_blockNumber','eth_getBalance','eth_getCode','eth_getTransactionCount','eth_gasPrice']);
const read=(url,method,params=[])=>{
 if(![publicRpc,alternative].includes(url)||!methods.has(method))throw Error('Read-only EF method/endpoint allowlist');
 return rpc(url,method,params,{timeoutMs:8000});
};
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('Set FRAMEFUZZ_SENDER_KEY in ignored local .env; never paste the key into chat');
const sender=privateKeyToAccount(key).address;
const [pubChain,altChain,pubVersion,altVersion,pubHead,altHead,code,balance,nonce,gasPrice]=await Promise.all([
 read(publicRpc,'eth_chainId'),read(alternative,'eth_chainId'),read(publicRpc,'web3_clientVersion'),read(alternative,'web3_clientVersion'),
 read(publicRpc,'eth_blockNumber'),read(alternative,'eth_blockNumber'),read(publicRpc,'eth_getCode',[sender,'latest']),
 read(publicRpc,'eth_getBalance',[sender,'latest']),read(publicRpc,'eth_getTransactionCount',[sender,'pending']),read(publicRpc,'eth_gasPrice')]);
if(Number(BigInt(pubChain))!==1337||Number(BigInt(altChain))!==1337)throw Error('EF chain ID mismatch; no candidate signed');
if(code!=='0x')throw Error('Fresh sender unexpectedly has deployed code; no EOA candidate signed');
const seq=BigInt(nonce);if(seq>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Unsafe pending nonce');
const candidate=await prepareSelfRelayCandidate({privateKey:key,recipient:sender,nonce:Number(seq)});
const output={...candidate,readOnlyPreflight:{observedAt:new Date().toISOString(),public:{chainId:Number(BigInt(pubChain)),version:pubVersion,head:pubHead},alternative:{chainId:Number(BigInt(altChain)),version:altVersion,head:altHead},sender:{address:sender,code, balanceWei:String(BigInt(balance)),pendingNonce:String(seq)},gasPriceWei:String(BigInt(gasPrice))},
 funding:{status:BigInt(balance)>=BigInt(candidate.fee.fundingCapWei)?'FUNDED':'UNFUNDED',requiredSenderBalanceWei:candidate.fee.fundingCapWei,shortfallWei:String(BigInt(candidate.fee.fundingCapWei)>BigInt(balance)?BigInt(candidate.fee.fundingCapWei)-BigInt(balance):0n)},
 admission:{public:null,alternative:null},receipt:null,writes:0};
await mkdir('runs',{recursive:true});
await writeFile('runs/step2a-self-relay-candidate.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({schema:output.schema,transactionHash:output.transactionHash,sender:output.sender,nonceSeq:output.nonceSeq,fee:output.fee,preflight:output.readOnlyPreflight,funding:output.funding,sourceParticipation:output.sourceParticipation,writes:0},null,2));
