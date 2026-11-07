#!/usr/bin/env node
/** Minimal paymaster top-up after observed Skandha liability accounting, then same-candidate retry. */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const PAYMASTER='0x3df63DFD230156C3656Bd4448326482030c31f96';
const CANDIDATE='0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067';
const REQUIRED=12_102_157_000_000_000n,BUFFER=100_000_000_000_000n,MAX_TOPUP=10_100_000_000_000_000n;
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing');
const account=privateKeyToAccount(key);
if(account.address.toLowerCase()!=='0x366e6203603c39eec1e75b3be6f078911447f235')throw Error('OPERATOR_DRIFT');
const candidate=JSON.parse(await readFile('evidence/prepared/2026-11-07/final-uniswap-policy-candidate.json','utf8'));
if(candidate.hash!==CANDIDATE||keccak256(candidate.raw)!==CANDIDATE)throw Error('CANDIDATE_DRIFT');
const [balanceHex,nonceHex,senderNonceHex,receipt]=await Promise.all([
  rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[PAYMASTER,'latest']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[account.address,'pending']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.sender,'pending']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE]),
]);
if(BigInt(senderNonceHex)!==0n||receipt)throw Error('CANDIDATE_STATE_CHANGED');
const balance=BigInt(balanceHex),topUp=REQUIRED>balance?REQUIRED-balance+BUFFER:0n;
if(topUp<=0n||topUp>MAX_TOPUP)throw Error(`TOPUP_OUT_OF_BOUNDS ${topUp}`);
const nonce=BigInt(nonceHex),gasPrice=3_000_000_000n,gas=21_000n;
const raw=await account.signTransaction({chainId:1337,type:'legacy',nonce,to:PAYMASTER,value:topUp,gas,gasPrice});
const hash=keccak256(raw);
const packet={schema:'framefuzz.uniswap-topup.v1',reason:'Observed Skandha included-stake liability remained reserved',operator:account.address,paymaster:PAYMASTER,nonce:String(nonce),valueWei:String(topUp),gasLimit:String(gas),gasPriceWei:String(gasPrice),maximumDebitWei:String(topUp+gas*gasPrice),hash,raw,candidate:CANDIDATE,beforeBalanceWei:String(balance),writes:0,broadcasts:0};
await writeFile('evidence/prepared/2026-11-07/final-uniswap-topup.json',JSON.stringify(packet,null,2)+'\n');
const sent=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[raw]);
if(sent.toLowerCase()!==hash.toLowerCase())throw Error('TOPUP_HASH_MISMATCH');
let topupReceipt=null;for(let i=0;i<60&&!topupReceipt;i++){topupReceipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);if(!topupReceipt)await new Promise(r=>setTimeout(r,2000));}
if(topupReceipt?.status!=='0x1')throw Error('TOPUP_NOT_CONFIRMED');
const beforeAlternative={at:new Date().toISOString(),candidateSenderNonce:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.sender,'pending']))),candidateReceipt:await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE]),paymasterBalanceWei:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[PAYMASTER,'latest'])))};
if(beforeAlternative.candidateSenderNonce!=='0'||beforeAlternative.candidateReceipt)throw Error('CANDIDATE_STATE_CHANGED_AFTER_TOPUP');
let response=null,error=null;
try{response=await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[candidate.wire]);}catch(e){error={code:e.code??null,message:String(e.message??e),data:e.data??null};}
let report=null;try{report=await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[CANDIDATE]);}catch{}
let inclusion=null;for(let i=0;i<8&&!inclusion;i++){inclusion=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE]);if(!inclusion)await new Promise(r=>setTimeout(r,2000));}
const evidence={schema:'framefuzz.uniswap-live-continuation.v1',observedAt:new Date().toISOString(),topup:{...packet,raw:undefined,writes:1,broadcasts:1,receipt:topupReceipt},canonicalPrior:{status:'REJECTED_POLICY',rule:'StorageReadNonSender'},beforeAlternative,alternative:{response,error,report},inclusion};
const serialized=JSON.stringify(evidence,null,2)+'\n';
await mkdir('evidence/live/2026-11-07',{recursive:true});
await writeFile('evidence/live/2026-11-07/uniswap-final-continuation.json',serialized,{flag:'wx'});
await writeFile('evidence/live/2026-11-07/uniswap-final-continuation.sha256',createHash('sha256').update(serialized).digest('hex')+'\n',{flag:'wx'});
console.log(JSON.stringify({topup:{hash,valueWei:String(topUp),maximumDebitWei:packet.maximumDebitWei},candidate:CANDIDATE,response,error,admission:report?.admission??null,entryStatus:report?.entry?.status??null,inclusion},null,2));
