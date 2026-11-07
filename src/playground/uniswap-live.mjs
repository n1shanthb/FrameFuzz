import {readFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {encodeFunctionData,keccak256} from 'viem';
import {generatePrivateKey,privateKeyToAccount} from 'viem/accounts';
import {rpc} from '../rpc.mjs';
import {buildSponsored} from '../adapters/workshop-codec.mjs';
import {inspectUniswap} from '../adapters/uniswap-state.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting} from '../adapters/ef-routing.mjs';

export const UNISWAP_SOURCE_SHA256='85a4891e08085f09d8c23df2a67e455d8f1e130e7c4bcbe17de6966ed9cf43ec';
export const UNISWAP_PAYMASTER='0x3df63DFD230156C3656Bd4448326482030c31f96';
export const UNISWAP_RUNTIME_HASH='0xe2cbf6c54ab43cd85acb4451ed95cc59cfb1255448032ae7851084fd2ea47f0c';
const REGISTRY='0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f';
const RECIPIENT='0x8943545177806ED17B9F23F0a21ee5948eCaa776';
const sourceUrl=new URL('../../vendor/paymaster/ReserveReadingPaymaster.sol',import.meta.url);
const evidenceUrl=new URL('../../evidence/live/2026-11-07/uniswap-policy-divergence-final.json',import.meta.url);
const configUrl=new URL('../../examples/live/devnet.json',import.meta.url);

export async function loadCapturedUniswapEvidence(){
  const evidence=JSON.parse(await readFile(evidenceUrl,'utf8'));
  const receipt=evidence.inclusion?.receipt,frames=receipt?.frameReceipts??[];
  if(evidence.chainId!==1337||evidence.transactions?.candidate!=='0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067')throw Error('CAPTURED_EVIDENCE_IDENTITY_DRIFT');
  if(evidence.comparison?.canonical?.status!=='REJECTED_POLICY'||evidence.comparison?.canonical?.rule!=='StorageReadNonSender')throw Error('CAPTURED_CANONICAL_DRIFT');
  if(evidence.comparison?.alternative?.admissionId!==2065||!/^ACCEPTED/.test(evidence.comparison?.alternative?.status??''))throw Error('CAPTURED_ALTERNATIVE_DRIFT');
  if(receipt?.status!=='0x1'||frames.length!==3||frames.some(frame=>frame.status!=='0x1'))throw Error('CAPTURED_RECEIPT_DRIFT');
  if(evidence.source?.sha256!==UNISWAP_SOURCE_SHA256||evidence.bindings?.paymaster?.toLowerCase()!==UNISWAP_PAYMASTER.toLowerCase())throw Error('CAPTURED_SOURCE_BINDING_DRIFT');
  return {schema:'framefuzz.captured-comparison.v1',id:'uniswap-policy-divergence-2065',provenance:'CAPTURED_LIVE_EVIDENCE',capturedAt:evidence.observedAt,chainId:1337,transactionIdentity:evidence.transactions.candidate,source:evidence.source,bindings:evidence.bindings,mutation:evidence.comparison.mutation,canonical:evidence.comparison.canonical,alternative:evidence.comparison.alternative,inclusion:evidence.inclusion,claims:evidence.claims,frameSummary:{successful:frames.filter(frame=>frame.status==='0x1').length,total:frames.length},evidencePath:'evidence/live/2026-11-07/uniswap-policy-divergence-final.json',notice:'Previously completed LIVE evidence. Viewing this record does not execute or broadcast a transaction.'};
}

async function depositInfo(address){
  const data=encodeFunctionData({abi:[{type:'function',name:'getDepositInfo',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'},{type:'uint32'},{type:'uint64'}]}],functionName:'getDepositInfo',args:[address]});
  const body=(await rpc(EF_CANONICAL_ENDPOINT,'eth_call',[{to:REGISTRY,data},'latest'])).slice(2);
  return {amountWei:String(BigInt('0x'+body.slice(0,64))),unstakeDelay:Number(BigInt('0x'+body.slice(64,128))),withdrawTime:Number(BigInt('0x'+body.slice(128,192)))};
}

/** Read-only source/runtime/state validation for a fresh, separately signed candidate. */
export async function prepareFreshUniswapComparison({source}){
  const digest=createHash('sha256').update(source).digest('hex');
  if(digest!==UNISWAP_SOURCE_SHA256)throw Error(`SOURCE_DIGEST_MISMATCH expected ${UNISWAP_SOURCE_SHA256} got ${digest}`);
  const canonical={chainId:await rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion')};
  const alternative={chainId:await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),skandhaInfo:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),skandhaConfig:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config')};
  const routing=assertEfRouting({canonical,alternative});
  const [code,balanceHex,nonceHex,stake,config]=await Promise.all([rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[UNISWAP_PAYMASTER,'latest']),rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[UNISWAP_PAYMASTER,'latest']),rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[UNISWAP_PAYMASTER,'pending']),depositInfo(UNISWAP_PAYMASTER),readFile(configUrl,'utf8').then(JSON.parse)]);
  if(code==='0x'||keccak256(code)!==UNISWAP_RUNTIME_HASH)throw Error('PAYMASTER_RUNTIME_MISMATCH');
  if(BigInt(stake.amountWei)<10_000_000_000_000_000n||stake.unstakeDelay!==86400||stake.withdrawTime!==0)throw Error('PAYMASTER_STAKE_NOT_READY');
  const uniswap=await inspectUniswap(config,EF_CANONICAL_ENDPOINT);
  const payerBalance=BigInt(balanceHex),maxFeePerGas=3_000_000_000n,maximumGasUnits=500_000n,maximumFeeExposure=maxFeePerGas*maximumGasUnits;
  if(payerBalance<maximumFeeExposure)throw Error(`PAYMASTER_UNDERFUNDED balance ${payerBalance} required ${maximumFeeExposure}`);
  const privateKey=generatePrivateKey(),sender=privateKeyToAccount(privateKey).address;
  const built=await buildSponsored({sender,payer:UNISWAP_PAYMASTER,recipient:RECIPIENT,nonce:0,chainId:1337,privateKey,poolRead:true,verificationGas:50000,maxFeePerGas});
  if(keccak256(built.raw)!==built.hash)throw Error('CANDIDATE_IDENTITY_MISMATCH');
  return {schema:'framefuzz.uniswap-live-candidate.v1',runId:randomUUID(),provenance:'FRESH_PREPARED_NOT_SUBMITTED',sourceDigest:digest,hash:built.hash,raw:built.raw,wire:built.wire,wallet:sender,sender,payer:UNISWAP_PAYMASTER,nonce:0,mutation:'ReserveReadingPaymaster PAYMENT VERIFY calldata 0x01 calls StateView.getSlot0(poolId)',verifyData:'0x01',requests:{public:{endpoint:EF_CANONICAL_ENDPOINT,method:'eth_sendRawTransaction'},alternative:{endpoint:EF_ALTERNATIVE_ENDPOINT,method:'eth_sendFrameTransaction'}},readiness:{routing,runtimeHash:UNISWAP_RUNTIME_HASH,paymasterBalanceWei:String(payerBalance),paymasterNonce:String(BigInt(nonceHex)),stake,uniswap},approvalPacket:{chainId:1337,transactionHash:built.hash,writes:['eth_sendRawTransaction(canonical)','eth_sendFrameTransaction(alternative) only after confirmed policy rejection'],maximumGasUnits:String(maximumGasUnits),maxFeePerGasWei:String(maxFeePerGas),maximumFeeExposureWei:String(maximumFeeExposure),maximumFeeExposureEth:Number(maximumFeeExposure)/1e18,note:'Fresh independently signed candidate. Canonical first; unchanged bytes to Skandha only after policy rejection. No retry or setup write.'},broadcasts:0,writes:0};
}

export async function uniswapSource(){return readFile(sourceUrl,'utf8');}
