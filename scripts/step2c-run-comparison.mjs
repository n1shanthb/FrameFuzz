#!/usr/bin/env node
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {prepareSelfRelayCandidate} from '../src/adapters/self-relay.mjs';

const PUBLIC='https://altmempool.forshtat.com/rpc';
const ALTERNATIVE='https://altmempool.forshtat.com';
const EXPECTED_HASH='0xd4d6123f6b142acccb5cf6c302877fe7a1ed499bd3bfb0263c70763febbba226';
const EXPECTED_SENDER='0x366E6203603C39Eec1e75b3be6f078911447f235';
const artifact=JSON.parse(await readFile('runs/step2a-self-relay-candidate.json','utf8'));
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing from ignored local environment');

let rpcId=0;
const call=async(endpoint,method,params=[],timeoutMs=10_000)=>{
 const request={jsonrpc:'2.0',id:++rpcId,method,params},startedAt=new Date().toISOString();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
  const text=await response.text();let body;try{body=JSON.parse(text)}catch{body={unparsed:text}}
  return {endpoint,request,startedAt,completedAt:new Date().toISOString(),httpStatus:response.status,response:body};
 }catch(error){return {endpoint,request,startedAt,completedAt:new Date().toISOString(),transportError:{name:error.name,message:error.message}}}
 finally{clearTimeout(timer)}
};
const result=x=>x.response?.result;

const reads=await Promise.all([
 call(PUBLIC,'eth_chainId'),call(ALTERNATIVE,'eth_chainId'),call(PUBLIC,'web3_clientVersion'),call(ALTERNATIVE,'web3_clientVersion'),
 call(PUBLIC,'eth_getBalance',[EXPECTED_SENDER,'latest']),call(PUBLIC,'eth_getTransactionCount',[EXPECTED_SENDER,'pending']),call(PUBLIC,'eth_getCode',[EXPECTED_SENDER,'latest']),call(PUBLIC,'eth_gasPrice'),
 call(PUBLIC,'eth_getTransactionReceipt',[EXPECTED_HASH]),call(ALTERNATIVE,'eth_getFrameTransactionReceipt',[EXPECTED_HASH]),
]);
const frameReceiptUnsupported=reads[9].response?.error?.code===-32601;
if(reads.slice(0,9).some(x=>x.transportError||x.response?.error)||(!frameReceiptUnsupported&&(reads[9].transportError||reads[9].response?.error)))throw Error(`Read-only preflight failed: ${JSON.stringify(reads.map(x=>x.transportError??x.response?.error??null))}`);
const [pubChain,altChain,pubVersion,altVersion,balance,nonce,code,gasPrice,canonicalBefore,frameBefore]=reads.map(result);
if(BigInt(pubChain)!==1337n||BigInt(altChain)!==1337n)throw Error('Endpoint chain mismatch');
if(BigInt(balance)!==500000000000000n||BigInt(nonce)!==0n||code!=='0x')throw Error('Sender state changed');
if(canonicalBefore!==null||(!frameReceiptUnsupported&&frameBefore!==null))throw Error('Candidate already has a receipt');
const rebuilt=await prepareSelfRelayCandidate({privateKey:key,recipient:EXPECTED_SENDER,nonce:0});
if(privateKeyToAccount(key).address.toLowerCase()!==EXPECTED_SENDER.toLowerCase())throw Error('Signer mismatch');
if(artifact.transactionHash!==EXPECTED_HASH||rebuilt.transactionHash!==EXPECTED_HASH||artifact.raw!==rebuilt.raw||keccak256(artifact.raw)!==EXPECTED_HASH)throw Error('Signed candidate identity changed');
if(JSON.stringify(artifact.wire)!==JSON.stringify(rebuilt.wire))throw Error('Structured request changed');
if(BigInt(gasPrice)>BigInt(artifact.fee.maxFeePerGasWei))throw Error('Current gas price exceeds signed max fee');

const preflight={observedAt:new Date().toISOString(),chainId:{public:Number(BigInt(pubChain)),alternative:Number(BigInt(altChain))},client:{public:pubVersion,alternative:altVersion},sender:{address:EXPECTED_SENDER,balanceWei:String(BigInt(balance)),pendingNonce:String(BigInt(nonce)),code},gasPriceWei:String(BigInt(gasPrice)),candidate:{transactionHash:EXPECTED_HASH,rawIdentity:keccak256(artifact.raw),nonceSeq:artifact.nonceSeq,maxFeePerGasWei:artifact.fee.maxFeePerGasWei,gasUpperBound:artifact.fee.gasUpperBound,maximumSenderSpendWei:artifact.fee.maxFeeWei},priorReceipt:{canonical:canonicalBefore,frame:frameReceiptUnsupported?'METHOD_UNSUPPORTED':frameBefore},status:'READY'};

// Public is initiated first; alternative is initiated immediately afterward without awaiting either response.
const publicPromise=call(PUBLIC,'eth_sendRawTransaction',[artifact.raw],15_000);
const alternativePromise=call(ALTERNATIVE,'eth_sendFrameTransaction',[artifact.wire],15_000);
const [publicSubmission,alternativeSubmission]=await Promise.all([publicPromise,alternativePromise]);

let canonicalReceipt=null,frameReceipt=null;
for(let attempt=0;attempt<12;attempt++){
 const [canonical,frame]=await Promise.all([call(PUBLIC,'eth_getTransactionReceipt',[EXPECTED_HASH]),frameReceiptUnsupported?Promise.resolve({skipped:'METHOD_UNSUPPORTED'}):call(ALTERNATIVE,'eth_getFrameTransactionReceipt',[EXPECTED_HASH])]);
 canonicalReceipt=canonical;frameReceipt=frame;
 if(result(canonical)!==null||(!frameReceiptUnsupported&&result(frame)!==null))break;
 await new Promise(resolve=>setTimeout(resolve,2500));
}
const evidence={schema:'framefuzz.admission-comparison.v1',classification:'LIVE',capturedAt:new Date().toISOString(),preflight,ordering:'PUBLIC_INITIATED_THEN_ALTERNATIVE_IMMEDIATELY_WITHOUT_AWAIT',requests:{public:publicSubmission,alternative:alternativeSubmission},receipts:{canonical:canonicalReceipt,frame:frameReceipt},retryCount:0,transactionIdentity:EXPECTED_HASH,notes:['A duplicate, already-known or timeout response is preserved as inconclusive path evidence.','Admission responses and inclusion receipts are separate observations.','No deployment or additional funding was performed.']};
await mkdir('evidence/admission/2026-11-07',{recursive:true});
await writeFile('evidence/admission/2026-11-07/self-relay-first-comparison.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({preflight,public:publicSubmission,alternative:alternativeSubmission,canonicalReceipt:result(canonicalReceipt),frameReceipt:result(frameReceipt),evidence:'evidence/admission/2026-11-07/self-relay-first-comparison.json'},null,2));
