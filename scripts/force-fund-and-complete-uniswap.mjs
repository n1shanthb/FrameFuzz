#!/usr/bin/env node
/** Force-send the authorized top-up to a nonpayable paymaster, then retry the unchanged candidate on Skandha. */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../src/rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';

const PAYMASTER='0x3df63DFD230156C3656Bd4448326482030c31f96',CANDIDATE='0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067';
const VALUE=9_955_055_000_000_000n,GAS=275_000n,GAS_PRICE=3_000_000_000n;
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing');
const account=privateKeyToAccount(key),candidate=JSON.parse(await readFile('evidence/prepared/2026-11-07/final-uniswap-policy-candidate.json','utf8'));
if(account.address.toLowerCase()!=='0x366e6203603c39eec1e75b3be6f078911447f235'||candidate.hash!==CANDIDATE||keccak256(candidate.raw)!==CANDIDATE)throw Error('IDENTITY_DRIFT');
const [nonceHex,beforeHex,senderNonceHex,candidateReceipt]=await Promise.all([rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[account.address,'pending']),rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[PAYMASTER,'latest']),rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.sender,'pending']),rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE])]);
if(BigInt(senderNonceHex)!==0n||candidateReceipt)throw Error('CANDIDATE_STATE_CHANGED');
const nonce=BigInt(nonceHex),before=BigInt(beforeHex);
// Constructor bytecode: PUSH20(paymaster) SELFDESTRUCT. Created and destroyed in the same transaction.
const data=`0x73${PAYMASTER.slice(2)}ff`;
const raw=await account.signTransaction({chainId:1337,type:'legacy',nonce,data,value:VALUE,gas:GAS,gasPrice:GAS_PRICE});
const hash=keccak256(raw),packet={schema:'framefuzz.uniswap-force-topup.v1',operator:account.address,beneficiary:PAYMASTER,nonce:String(nonce),valueWei:String(VALUE),gasLimit:String(GAS),gasPriceWei:String(GAS_PRICE),maximumDebitWei:String(VALUE+GAS*GAS_PRICE),creationData:data,hash,raw,writes:0,broadcasts:0};
await writeFile('evidence/prepared/2026-11-07/final-uniswap-force-topup.json',JSON.stringify(packet,null,2)+'\n');
const sent=await rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[raw]);if(sent.toLowerCase()!==hash.toLowerCase())throw Error('HASH_MISMATCH');
let receipt=null;for(let i=0;i<60&&!receipt;i++){receipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);if(!receipt)await new Promise(r=>setTimeout(r,2000));}
if(receipt?.status!=='0x1')throw Error(`FORCE_TOPUP_FAILED ${JSON.stringify(receipt)}`);
const after=BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[PAYMASTER,'latest']));if(after-before!==VALUE)throw Error(`BALANCE_DELTA_MISMATCH ${after-before}`);
const beforeAlternative={at:new Date().toISOString(),candidateSenderNonce:String(BigInt(await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.sender,'pending']))),candidateReceipt:await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE]),paymasterBalanceWei:String(after)};
if(beforeAlternative.candidateSenderNonce!=='0'||beforeAlternative.candidateReceipt)throw Error('CANDIDATE_STATE_CHANGED_AFTER_TOPUP');
let response=null,error=null;try{response=await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[candidate.wire]);}catch(e){error={code:e.code??null,message:String(e.message??e),data:e.data??null};}
let report=null;try{report=await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[CANDIDATE]);}catch{}
let inclusion=null;for(let i=0;i<8&&!inclusion;i++){inclusion=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[CANDIDATE]);if(!inclusion)await new Promise(r=>setTimeout(r,2000));}
const evidence={schema:'framefuzz.uniswap-live-force-topup.v1',observedAt:new Date().toISOString(),failedDirectTransfer:'0xa86e0a23cf4fe14835cea0cc316af25ce649ca53b4a372bdd21e9000d62839ac',topup:{...packet,raw:undefined,writes:1,broadcasts:1,receipt,balanceBeforeWei:String(before),balanceAfterWei:String(after)},canonicalPrior:{status:'REJECTED_POLICY',rule:'StorageReadNonSender'},beforeAlternative,alternative:{response,error,report},inclusion};
const serialized=JSON.stringify(evidence,null,2)+'\n';await mkdir('evidence/live/2026-11-07',{recursive:true});await writeFile('evidence/live/2026-11-07/uniswap-final-force-topup.json',serialized,{flag:'wx'});await writeFile('evidence/live/2026-11-07/uniswap-final-force-topup.sha256',createHash('sha256').update(serialized).digest('hex')+'\n',{flag:'wx'});
console.log(JSON.stringify({topup:{hash,valueWei:String(VALUE),maximumDebitWei:packet.maximumDebitWei,balanceAfterWei:String(after)},candidate:CANDIDATE,response,error,admission:report?.admission??null,entryStatus:report?.entry?.status??null,inclusion},null,2));
