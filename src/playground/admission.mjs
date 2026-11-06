import {privateKeyToAccount} from 'viem/accounts';
import {keccak256} from 'viem';
import {buildSponsored} from '../adapters/workshop-codec.mjs';
import {rpc} from '../rpc.mjs';

export const EF_PUBLIC='https://altmempool.forshtat.com/rpc';
export const EF_ALTERNATIVE='https://altmempool.forshtat.com';
const ADDRESS=/^0x[0-9a-f]{40}$/i;
const HEXKEY=/^0x[0-9a-f]{64}$/i;
const cleanError=e=>String(e?.message??e).slice(0,180);
const snapshot=async(url,rpcFn)=>{
 try{
  const [chain,client,head]=await Promise.all([
   rpcFn(url,'eth_chainId'),rpcFn(url,'web3_clientVersion'),rpcFn(url,'eth_blockNumber')]);
  return {status:Number(BigInt(chain))===1337?'READY':'UNAVAILABLE',chainId:Number(BigInt(chain)),clientVersion:String(client).slice(0,120),blockNumber:head,readOnly:true};
 }catch(e){return {status:'UNAVAILABLE',reason:cleanError(e),readOnly:true};}
};

/** Read-only chain state. A role declaration never substitutes for deployed bytecode. */
export async function admissionReadiness(analysis,{rpcFn=rpc,env=process.env,config={}}={}){
 const [publicPath,alternativePath]=await Promise.all([snapshot(EF_PUBLIC,rpcFn),snapshot(EF_ALTERNATIVE,rpcFn)]);
 const sourceReady=analysis?.status==='READY';
 const role=analysis?.detectedRole?.role??'UNKNOWN';
 const supportedRole=['SENDER_VALIDATOR','PAYMASTER'].includes(role);
 const payer=config.paymasters?.basic;
 let deployment={status:'MISSING',address:ADDRESS.test(payer??'')?payer:null,reason:ADDRESS.test(payer??'')?'Configured basic paymaster bytecode is unverified because the public RPC is unavailable':'No configured basic paymaster address'};
 let funding={status:'MISSING',reason:'No verified funded signing wallet and payer'};
 let nonce=null;
 if(ADDRESS.test(payer??'')&&publicPath.status==='READY'){
  try{
   const [code,balance]=await Promise.all([rpcFn(EF_PUBLIC,'eth_getCode',[payer,'latest']),rpcFn(EF_PUBLIC,'eth_getBalance',[payer,'latest'])]);
   const codeHash=code==='0x'?'EMPTY':keccak256(code);
   const pinned=config.paymasterCodeHashes?.basic;
   deployment={status:code!=='0x'&&(!pinned||pinned===codeHash)?'READY':'MISSING',address:payer,codeHash,expectedCodeHash:pinned??null,reason:code==='0x'?'Configured basic paymaster has empty bytecode':pinned&&pinned!==codeHash?'Paymaster code hash differs from pinned profile':null};
   funding={status:BigInt(balance)>=BigInt(config.minSponsorBalanceWei??'1000000000000000')?'READY':'MISSING',payerBalanceWei:String(BigInt(balance)),reason:BigInt(balance)===0n?'Basic paymaster balance is zero':null};
  }catch(e){deployment={status:'MISSING',reason:cleanError(e)};}
 }
 let wallet=null;
 if(HEXKEY.test(env.FRAMEFUZZ_DEPLOYER_KEY??'')){
  try{wallet=privateKeyToAccount(env.FRAMEFUZZ_DEPLOYER_KEY).address;
   if(publicPath.status==='READY'){
    const [balance,pending]=await Promise.all([rpcFn(EF_PUBLIC,'eth_getBalance',[wallet,'latest']),rpcFn(EF_PUBLIC,'eth_getTransactionCount',[wallet,'pending'])]);
    nonce=pending;funding={...funding,operatorAddress:wallet,operatorBalanceWei:String(BigInt(balance))};
   }
  }catch{wallet=null;}
 }
 const blockers=[];
 if(!sourceReady)blockers.push('Compile the exact submitted source');
 if(!supportedRole)blockers.push('Submitted source is not a verified EIP-8141 sender validator or paymaster; an unchanged execution contract needs a separately deployed sender/paymaster harness');
 if(publicPath.status!=='READY')blockers.push('Public RPC chain 1337 read check failed');
 if(alternativePath.status!=='READY')blockers.push('Alternative service chain 1337 read check failed');
 if(deployment.status!=='READY')blockers.push(deployment.reason??'Deploy and pin a basic paymaster');
 if(funding.status!=='READY')blockers.push(funding.reason??'Fund the basic paymaster');
 if(!wallet&&deployment.status!=='READY')blockers.push('Configure a funded devnet-only FRAMEFUZZ_DEPLOYER_KEY to redeploy the missing paymaster; sender signing can use a separate ephemeral key');
 const candidateReady=blockers.length===0;
 return {schema:'framefuzz.admission-readiness.v1',chainId:1337,sourceDigest:analysis?.sourceDigest??null,analysisId:analysis?.analysisId??null,
  sourceCompiled:sourceReady?'READY':'FAILED',supportedFrameRole:supportedRole?role:'NONE',frameContext:supportedRole?'BLOCKED':'BLOCKED',
  sourceRoleBasis:analysis?.detectedRole?.basis??'No compiled source',transactionConstruction:'Pinned ethrex-eip8141-tracer codec; VERIFY(EXECUTION) → VERIFY(PAYMENT) → SENDER. A deployed trusted harness and signer are prerequisites.',
  publicEndpoint:{url:EF_PUBLIC,...publicPath,submissionMethod:'eth_sendRawTransaction'},alternativeEndpoint:{url:EF_ALTERNATIVE,...alternativePath,submissionMethod:'eth_sendFrameTransaction'},
  deployment,walletAndFunding:funding,operatorWalletConfigured:Boolean(wallet),nonce,signatureRequirements:['Fresh ephemeral sender private key in memory','Pinned workshop signing profile','Deployed paymaster able to pay gas'],
  gasLimits:{senderVerify:30000,paymentVerify:50000,action:50000,maxFeePerGasWei:'2000000000',maxTotalPerPathWei:'1000000000000000'},
  signedComparisonCandidate:candidateReady?'READY':'BLOCKED',liveExecution:candidateReady?'AUTHORIZATION REQUIRED':'BLOCKED',comparisonCapability:'Signed identical bytes can be prepared for both endpoint methods; sequential submission can produce duplicate/known-tx results and is not two independent policy verdicts.',
  blockers,classification:candidateReady?'READY_FOR_CANDIDATE':'BLOCKED_PRECONDITION',observedAdmissions:[],writes:0};
}

/** Prepare only. The caller supplies a freshly generated devnet sender key and verified context. */
export async function prepareSponsoredCandidate({analysis,readiness,senderKey,payer,recipient,nonce,mutation={id:'baseline',verificationGas:50000}}){
 if(readiness?.classification!=='READY_FOR_CANDIDATE'||readiness.analysisId!==analysis?.analysisId)throw Error('BLOCKED_PRECONDITION: current source and chain readiness required');
 if(!HEXKEY.test(senderKey??'')||!ADDRESS.test(payer??'')||!ADDRESS.test(recipient??'')||!Number.isSafeInteger(nonce)||nonce<0)throw Error('Invalid signed candidate context');
 if(payer.toLowerCase()!==readiness.deployment.address.toLowerCase())throw Error('Payer differs from verified deployed contract');
 if(!Number.isSafeInteger(mutation.verificationGas)||mutation.verificationGas<21000||mutation.verificationGas>100000)throw Error('Verification gas out of bounded range');
 const sender=privateKeyToAccount(senderKey).address;
 const built=await buildSponsored({sender,payer,recipient,nonce,chainId:1337,privateKey:senderKey,verificationGas:mutation.verificationGas});
 return {schema:'framefuzz.signed-comparison-candidate.v1',chainId:1337,sourceDigest:analysis.sourceDigest,analysisId:analysis.analysisId,
  mutation:{id:mutation.id,verificationGas:mutation.verificationGas},sender,payer,nonce,hash:built.hash,raw:built.raw,wire:built.wire,
  frameDefinitions:built.wire.frames,signature:built.wire.signatures,ruleProfile:'ethrex-eip8141-tracer',
  requests:{public:{endpoint:EF_PUBLIC,method:'eth_sendRawTransaction',params:[built.raw]},alternative:{endpoint:EF_ALTERNATIVE,method:'eth_sendFrameTransaction',params:[built.wire]}},
  observedAdmissions:[],broadcasts:0,notice:'Prepared only. No RPC submission or independent admission verdict.'};
}
