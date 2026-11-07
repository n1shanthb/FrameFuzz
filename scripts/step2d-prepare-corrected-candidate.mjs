#!/usr/bin/env node
/** Read-only endpoint/state preflight plus offline nonce-1 signing. Contains no send method. */
import {mkdir,writeFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../src/rpc.mjs';
import {prepareSelfRelayCandidate} from '../src/adapters/self-relay.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';

const METHODS=new Set(['eth_chainId','web3_clientVersion','eth_blockNumber','eth_getBalance','eth_getCode','eth_getTransactionCount','eth_gasPrice','skandha_config','skandha_explorer_info','skandha_explorer_getTransaction']);
const read=(url,method,params=[])=>{if(![EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT].includes(url)||!METHODS.has(method))throw Error('Step 2D read-only allowlist');return rpc(url,method,params,{timeoutMs:10_000});};
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing from ignored local environment');
const sender=privateKeyToAccount(key).address;
const [canonicalChain,alternativeChain,canonicalClient,alternativeClient,head,balance,nonce,code,gasPrice,skandhaConfig,skandhaInfo]=await Promise.all([
 read(EF_CANONICAL_ENDPOINT,'eth_chainId'),read(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),read(EF_CANONICAL_ENDPOINT,'web3_clientVersion'),read(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),read(EF_CANONICAL_ENDPOINT,'eth_blockNumber'),read(EF_CANONICAL_ENDPOINT,'eth_getBalance',[sender,'latest']),read(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[sender,'pending']),read(EF_CANONICAL_ENDPOINT,'eth_getCode',[sender,'latest']),read(EF_CANONICAL_ENDPOINT,'eth_gasPrice'),read(EF_ALTERNATIVE_ENDPOINT,'skandha_config'),read(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),
]);
const routing=assertEfRouting({canonical:{chainId:canonicalChain,clientVersion:canonicalClient},alternative:{chainId:alternativeChain,clientVersion:alternativeClient,skandhaConfig,skandhaInfo}});
if(sender.toLowerCase()!=='0x366e6203603c39eec1e75b3be6f078911447f235')throw Error('Unexpected local sender');
if(BigInt(nonce)!==1n||code!=='0x')throw Error('Expected funded nonce-1 EOA state');
const candidate=await prepareSelfRelayCandidate({privateKey:key,recipient:sender,nonce:1});
if(candidate.transactionHash!==keccak256(candidate.raw))throw Error('Raw transaction identity mismatch');
const operatorCeilingWei=210000000000000n;
if(BigInt(candidate.fee.maxFeeWei)>operatorCeilingWei)throw Error('Candidate exceeds proposed operator ceiling');
if(BigInt(balance)<operatorCeilingWei)throw Error('Remaining sender balance is below proposed ceiling');
const output={...candidate,classification:'OFFLINE_SIGNED_FUNDED_CANDIDATE',readOnlyPreflight:{observedAt:new Date().toISOString(),head,canonical:{endpoint:EF_CANONICAL_ENDPOINT,chainId:Number(BigInt(canonicalChain)),clientVersion:canonicalClient,...routing.canonical},alternative:{endpoint:EF_ALTERNATIVE_ENDPOINT,chainId:Number(BigInt(alternativeChain)),clientVersion:alternativeClient,...routing.alternative,skandhaInfo,skandhaConfig:{chainId:skandhaConfig.chainId,redirectRpc:skandhaConfig.flags?.redirectRpc,rpcEndpointSubmit:skandhaConfig.rpcEndpointSubmit,validationGasLimit:skandhaConfig.validationGasLimit}},sender:{address:sender,balanceWei:String(BigInt(balance)),pendingNonce:String(BigInt(nonce)),code},gasPriceWei:String(BigInt(gasPrice))},operatorApproval:{status:'AWAITING_APPROVAL',maximumSenderSpendWei:candidate.fee.maxFeeWei,proposedCeilingWei:String(operatorCeilingWei),remainingBalanceAfterMaximumWei:String(BigInt(balance)-BigInt(candidate.fee.maxFeeWei))},writes:0,broadcasts:0};
await mkdir('runs',{recursive:true});
await writeFile('runs/step2d-corrected-candidate.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({transactionHash:output.transactionHash,sender:output.sender,nonceSeq:output.nonceSeq,requests:output.requests,fee:output.fee,preflight:output.readOnlyPreflight,operatorApproval:output.operatorApproval,writes:0,broadcasts:0},null,2));
