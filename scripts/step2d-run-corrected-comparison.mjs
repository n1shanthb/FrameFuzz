#!/usr/bin/env node
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {prepareSelfRelayCandidate} from '../src/adapters/self-relay.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../src/adapters/ef-routing.mjs';

const HASH='0xc05703acca2def2f89567ac33618b48a44b7eb021c2db0023e5f3b90227ba510';
const SENDER='0x366E6203603C39Eec1e75b3be6f078911447f235';
const OPERATOR_CEILING=210000000000000n;
const artifact=JSON.parse(await readFile('runs/step2d-corrected-candidate.json','utf8'));
const key=process.env.FRAMEFUZZ_SENDER_KEY;
if(!/^0x[0-9a-f]{64}$/i.test(key??''))throw Error('FRAMEFUZZ_SENDER_KEY missing from ignored local environment');

let id=0;
const call=async(endpoint,method,params=[],timeoutMs=12_000)=>{
 const request={jsonrpc:'2.0',id:++id,method,params},startedAt=new Date().toISOString();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request),signal:controller.signal});const text=await response.text();let body;try{body=JSON.parse(text)}catch{body={unparsed:text}}return {endpoint,request,startedAt,completedAt:new Date().toISOString(),httpStatus:response.status,response:body};}
 catch(error){return {endpoint,request,startedAt,completedAt:new Date().toISOString(),transportError:{name:error.name,message:error.message}}}
 finally{clearTimeout(timer)}
};
const value=x=>x.response?.result;
const required=async(endpoint,method,params=[])=>{const r=await call(endpoint,method,params);if(r.transportError||r.response?.error)throw Error(`Preflight ${method} failed: ${JSON.stringify(r.transportError??r.response.error)}`);return r;};

const [canonicalChain,alternativeChain,canonicalClient,alternativeClient,balance,nonce,code,gasPrice,config,info,canonicalReceipt,sidecarLookup]=await Promise.all([
 required(EF_CANONICAL_ENDPOINT,'eth_chainId'),required(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),required(EF_CANONICAL_ENDPOINT,'web3_clientVersion'),required(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),required(EF_CANONICAL_ENDPOINT,'eth_getBalance',[SENDER,'latest']),required(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[SENDER,'pending']),required(EF_CANONICAL_ENDPOINT,'eth_getCode',[SENDER,'latest']),required(EF_CANONICAL_ENDPOINT,'eth_gasPrice'),required(EF_ALTERNATIVE_ENDPOINT,'skandha_config'),required(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),required(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[HASH]),call(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[HASH]),
]);
const routing=assertEfRouting({canonical:{chainId:value(canonicalChain),clientVersion:value(canonicalClient)},alternative:{chainId:value(alternativeChain),clientVersion:value(alternativeClient),skandhaConfig:value(config),skandhaInfo:value(info)}});
if(privateKeyToAccount(key).address.toLowerCase()!==SENDER.toLowerCase())throw Error('Signer mismatch');
if(BigInt(value(balance))<OPERATOR_CEILING||BigInt(value(nonce))!==1n||value(code)!=='0x')throw Error('Sender state no longer matches approval');
if(value(canonicalReceipt)!==null)throw Error('Candidate already has a canonical receipt');
const sidecarMissing=sidecarLookup.response?.error?.code===-32600&&/not found/i.test(sidecarLookup.response.error.message??'');
if(!sidecarMissing)throw Error('Candidate already known to sidecar or lookup failed unexpectedly');
const rebuilt=await prepareSelfRelayCandidate({privateKey:key,recipient:SENDER,nonce:1});
if(artifact.transactionHash!==HASH||rebuilt.transactionHash!==HASH||artifact.raw!==rebuilt.raw||keccak256(artifact.raw)!==HASH||JSON.stringify(artifact.wire)!==JSON.stringify(rebuilt.wire))throw Error('Candidate identity changed');
if(BigInt(artifact.fee.maxFeeWei)>OPERATOR_CEILING||BigInt(value(gasPrice))>BigInt(artifact.fee.maxFeePerGasWei))throw Error('Approved fee bounds no longer hold');
const preflight={observedAt:new Date().toISOString(),routing,sender:{address:SENDER,balanceWei:String(BigInt(value(balance))),pendingNonce:String(BigInt(value(nonce))),code:value(code)},gasPriceWei:String(BigInt(value(gasPrice))),candidate:{hash:HASH,rawIdentity:keccak256(artifact.raw),maximumSenderSpendWei:artifact.fee.maxFeeWei,operatorCeilingWei:String(OPERATOR_CEILING)},prior:{canonicalReceipt:null,sidecar:'FRAME_TRANSACTION_NOT_FOUND'},status:'READY'};

// Approved order: alternative initiated first, canonical immediately afterward; neither awaits the other.
const alternativePromise=call(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[artifact.wire],15_000);
const canonicalPromise=call(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[artifact.raw],15_000);
const [alternativeSubmission,canonicalSubmission]=await Promise.all([alternativePromise,canonicalPromise]);

let canonicalAfter=null,sidecarAfter=null;
for(let attempt=0;attempt<12;attempt++){
 [canonicalAfter,sidecarAfter]=await Promise.all([call(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[HASH]),call(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[HASH])]);
 if(value(canonicalAfter)!==null||value(sidecarAfter)!==undefined)break;
 await new Promise(resolve=>setTimeout(resolve,2500));
}
const evidence={schema:'framefuzz.admission-comparison.v1',classification:'LIVE',capturedAt:new Date().toISOString(),transactionIdentity:HASH,preflight,ordering:'ALTERNATIVE_INITIATED_FIRST_THEN_CANONICAL_IMMEDIATELY_WITHOUT_AWAIT',requests:{alternative:alternativeSubmission,canonical:canonicalSubmission},observations:{canonicalReceipt:canonicalAfter,sidecarAdmissionReport:sidecarAfter},retryCount:0,notes:['No submission retry occurred.','Duplicate, known, timeout and nonce-conflict responses remain path-inconclusive.','Canonical inclusion and sidecar admission are classified independently.']};
await mkdir('evidence/admission/2026-11-07',{recursive:true});
await writeFile('evidence/admission/2026-11-07/self-relay-corrected-comparison.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({preflight,alternative:alternativeSubmission,canonical:canonicalSubmission,canonicalReceipt:value(canonicalAfter),sidecarAdmission:value(sidecarAfter),evidence:'evidence/admission/2026-11-07/self-relay-corrected-comparison.json'},null,2));
