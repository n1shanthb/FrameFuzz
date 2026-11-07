import {encodeFunctionData,keccak256} from 'viem';
import {rpc} from '../rpc.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT,assertEfRouting,classifyEfEndpoint} from '../adapters/ef-routing.mjs';
import {STAKING_REGISTRY,STAKE_WEI,WALLET_FUNDING_WEI,WORKSHOP_RECIPIENT,signWalletCandidate} from '../adapters/wallet-codec.mjs';
import {comparePolicyCandidate} from '../policy-comparison.mjs';

export const LIVE_ADMISSION_CAPABILITY='STORAGE_ACCESS_VALIDATOR_V1';
const ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const clean=e=>String(e?.message??e).slice(0,200);

/** Compare on-chain runtime to solc template after zeroing immutable slots (constructor-filled). */
export function runtimeMatchesTemplate(onChainCode,templateCode,immutableReferences=null){
  if(!onChainCode||!templateCode||onChainCode==='0x'||templateCode==='0x')return false;
  if(onChainCode.toLowerCase()===templateCode.toLowerCase())return true;
  const a=Buffer.from(onChainCode.slice(2),'hex'),b=Buffer.from(templateCode.slice(2),'hex');
  if(a.length!==b.length)return false;
  const mask=Buffer.alloc(a.length,0);
  for(const sites of Object.values(immutableReferences??{})){
    for(const site of sites??[]){
      const start=Number(site.start),len=Number(site.length);
      if(!Number.isFinite(start)||!Number.isFinite(len)||start<0||len<0||start+len>mask.length)return false;
      mask.fill(1,start,start+len);
    }
  }
  for(let i=0;i<a.length;i++)if(!mask[i]&&a[i]!==b[i])return false;
  return true;
}

async function endpointSnapshot(url,expected){
  try{
    const [chain,client,head]=await Promise.all([rpc(url,'eth_chainId'),rpc(url,'web3_clientVersion'),rpc(url,'eth_blockNumber')]);
    let skandhaInfo=null,skandhaConfig=null;
    if(expected==='ALTERNATIVE_SIDECAR'){
      try{skandhaInfo=await rpc(url,'skandha_explorer_info');}catch{}
      try{skandhaConfig=await rpc(url,'skandha_config');}catch{}
    }
    const identity=classifyEfEndpoint({chainId:chain,clientVersion:client,skandhaInfo,skandhaConfig});
    return {status:identity.role===expected?'READY':'UNAVAILABLE',url,chainId:Number(BigInt(chain)),clientVersion:String(client).slice(0,120),identity,blockNumber:Number(BigInt(head)),skandhaInfo,readOnly:true};
  }catch(e){return {status:'UNAVAILABLE',url,reason:clean(e),readOnly:true};}
}

async function stakeOf(wallet){
  try{
    const data=encodeFunctionData({abi:[{type:'function',name:'getDepositInfo',stateMutability:'view',inputs:[{type:'address'}],outputs:[{type:'uint256'},{type:'uint32'},{type:'uint64'}]}],functionName:'getDepositInfo',args:[wallet]});
    const raw=await rpc(EF_CANONICAL_ENDPOINT,'eth_call',[{to:STAKING_REGISTRY,data},'latest']);
    const body=(raw??'0x').slice(2);
    if(body.length<192)return {amountWei:'0',unstakeDelay:0,withdrawTime:0,status:'UNSTAKED_OR_EMPTY'};
    const amount=BigInt('0x'+body.slice(0,64));
    const unstakeDelay=Number(BigInt('0x'+body.slice(64,128)));
    const withdrawTime=Number(BigInt('0x'+body.slice(128,192)));
    return {amountWei:String(amount),unstakeDelay,withdrawTime,status:amount>10000000000000000n&&withdrawTime===0?'STAKED':amount>0n?'PARTIAL_OR_UNLOCKING':'UNSTAKED'};
  }catch(e){return {status:'LOOKUP_FAILED',reason:clean(e)};}
}

/** Read-only readiness for the supported storage-access validator live path. */
export async function liveAdmissionReadiness(analysis,{wallet=null,foreign=null,owner=null}={}){
  const [canonical,alternative]=await Promise.all([
    endpointSnapshot(EF_CANONICAL_ENDPOINT,'CANONICAL_EXECUTION'),
    endpointSnapshot(EF_ALTERNATIVE_ENDPOINT,'ALTERNATIVE_SIDECAR'),
  ]);
  const role=analysis?.detectedRole?.role;
  const supported=role==='SENDER_VALIDATOR'&&analysis?.capabilities?.includes('LIVE_STORAGE_ACCESS_ADMISSION');
  const blockers=[];
  if(analysis?.status!=='READY')blockers.push('Compile the exact pasted storage-access validator source');
  if(!supported)blockers.push('Live admission comparison supports only the labeled storage-access ViolatingWallet interface (not arbitrary Solidity)');
  if(!analysis?.runtimeBytecodeHash)blockers.push('Compiler did not emit runtime bytecode for source binding');
  if(canonical.status!=='READY')blockers.push(canonical.reason??'Canonical ethrex read failed');
  if(alternative.status!=='READY')blockers.push(alternative.reason??'Alternative Skandha read failed');
  let deployment={status:'MISSING',wallet:null,foreign:null};
  let stake={status:'UNKNOWN'};
  let nonce=null;
  if(ADDRESS.test(wallet??'')&&canonical.status==='READY'){
    try{
      const [code,bal,pending]=await Promise.all([
        rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[wallet,'latest']),
        rpc(EF_CANONICAL_ENDPOINT,'eth_getBalance',[wallet,'latest']),
        rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[wallet,'pending']),
      ]);
      const codeHash=code==='0x'?'EMPTY':keccak256(code);
      const exact=analysis.runtimeBytecodeHash&&codeHash===analysis.runtimeBytecodeHash;
      const bound=exact||runtimeMatchesTemplate(code,analysis.runtimeBytecode,analysis.immutableReferences);
      deployment={status:code!=='0x'&&bound?'READY':code==='0x'?'MISSING':'CODE_MISMATCH',wallet,foreign,codeHash,expectedRuntimeHash:analysis.runtimeBytecodeHash,balanceWei:String(BigInt(bal)),bound,boundMode:exact?'EXACT_HASH':bound?'IMMUTABLE_SLOTS':null};
      nonce=Number(BigInt(pending));
      stake=await stakeOf(wallet);
      if(deployment.status!=='READY')blockers.push(deployment.status==='MISSING'?'Deploy Foreign + ViolatingWallet and bind runtime bytecode hash':'On-chain wallet bytecode does not match compiled source digest/runtime hash');
      if(stake.status!=='STAKED')blockers.push('Stake the wallet itself for >0.01 test ETH with unstake delay 86400 before expecting alternative acceptance');
    }catch(e){blockers.push(clean(e));}
  }else if(supported){
    blockers.push('Provide the deployed ViolatingWallet address after operator-approved deployment');
  }
  if(ADDRESS.test(foreign??'')&&canonical.status==='READY'){
    try{
      const fCode=await rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[foreign,'latest']);
      if(fCode==='0x')blockers.push('Foreign storage target has empty code');
    }catch(e){blockers.push(clean(e));}
  }
  const classification=blockers.length===0?'READY_FOR_LIVE_COMPARISON':'BLOCKED_PRECONDITION';
  return {
    schema:'framefuzz.live-admission-readiness.v1',
    capability:LIVE_ADMISSION_CAPABILITY,
    classification,
    sourceDigest:analysis?.sourceDigest??null,
    analysisId:analysis?.analysisId??null,
    contractName:analysis?.contractName??null,
    runtimeBytecodeHash:analysis?.runtimeBytecodeHash??null,
    owner:owner??null,
    canonical,alternative,
    deployment,stake,nonce,
    stakingRegistry:STAKING_REGISTRY,
    recipient:WORKSHOP_RECIPIENT,
    fundingHints:{walletCreationValueWei:String(WALLET_FUNDING_WEI),stakeWei:String(STAKE_WEI),minStakeExclusiveWei:'10000000000000000'},
    protocol:{order:['VERIFY_CHAIN_CODE_STAKE_NONCE','SUBMIT_CANONICAL_FIRST','REQUIRE_POLICY_REJECTION','CONFIRM_NONCE_UNCHANGED_AND_NULL_RECEIPT','SUBMIT_SAME_SIGNED_BYTES_TO_SKANDHA','QUERY_ADMISSION_REPORT_AND_INCLUSION'],racePolicy:'NO_PARALLEL_SUBMISSION'},
    blockers,
    writes:0,
    notice:'Read-only. No deployment, stake, funding or admission broadcast from this call.',
  };
}

/** Prepare a fresh signed policy candidate. Does not broadcast. */
export async function prepareLiveComparison({analysis,readiness,privateKey,wallet,owner,verifyData='0x01'}){
  if(readiness?.classification!=='READY_FOR_LIVE_COMPARISON')throw Error('BLOCKED_PRECONDITION: '+((readiness?.blockers??[]).join(' · ')||'not ready'));
  if(readiness.analysisId!==analysis.analysisId)throw Error('STALE_ANALYSIS');
  if(!ADDRESS.test(wallet)||wallet.toLowerCase()!==readiness.deployment.wallet.toLowerCase())throw Error('Wallet address differs from verified deployment');
  const nonce=readiness.nonce;
  if(!Number.isSafeInteger(nonce)||nonce<0)throw Error('Missing live wallet nonce');
  const candidate=await signWalletCandidate({
    privateKey,wallet,owner,nonce,verifyData,
    sourceDigest:analysis.sourceDigest,analysisId:analysis.analysisId,
    mutation:'ViolatingWallet VERIFY data triggers FOREIGN.staticcall (StorageReadNonSender vs staked alt admit)',
  });
  const maxFeePerGas=2_000_000_000n;
  const maxGasUnits=500_000n;
  const feeExposureWei=maxFeePerGas*maxGasUnits;
  return {
    ...candidate,
    readinessSnapshot:{stake:readiness.stake,codeHash:readiness.deployment.codeHash,boundMode:readiness.deployment.boundMode??null,canonicalHead:readiness.canonical.blockNumber,alternativeBootId:readiness.alternative.skandhaInfo?.bootId??null,foreign:readiness.deployment.foreign??null},
    approvalPacket:{
      writes:['eth_sendRawTransaction(canonical)','eth_sendFrameTransaction(alternative) if policy-rejected'],
      chainId:1337,
      transactionHash:candidate.hash,
      nonce:candidate.nonce,
      wallet:candidate.wallet,
      maxFeePerGasWei:String(maxFeePerGas),
      maximumGasUnits:String(maxGasUnits),
      maximumFeeExposureWei:String(feeExposureWei),
      maximumFeeExposureEth:Number(feeExposureWei)/1e18,
      note:'Same signed bytes on both paths. No automatic retry. Inclusion is checked separately and is not implied by admission.',
    },
    notice:'Prepared only. Operator confirmation required before sequential live submission.',
  };
}

/** Execute rejection-first comparison. Caller must already hold explicit write authorization. */
export async function runLiveComparison({candidate,authorizeWrites=false}){
  if(authorizeWrites!==true)throw Error('Live comparison requires explicit authorizeWrites=true after operator approval');
  if(!candidate?.raw||!candidate?.wire||!candidate?.hash)throw Error('Missing signed candidate');
  assertEfRouting({
    canonical:{chainId:await rpc(EF_CANONICAL_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_CANONICAL_ENDPOINT,'web3_clientVersion')},
    alternative:{chainId:await rpc(EF_ALTERNATIVE_ENDPOINT,'eth_chainId'),clientVersion:await rpc(EF_ALTERNATIVE_ENDPOINT,'web3_clientVersion'),skandhaInfo:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_info'),skandhaConfig:await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_config')},
  });
  const result=await comparePolicyCandidate({
    candidate,
    simulateCanonical:async raw=>rpc(EF_CANONICAL_ENDPOINT,'eth_callFrameTransaction',[raw]),
    submitCanonical:async raw=>rpc(EF_CANONICAL_ENDPOINT,'eth_sendRawTransaction',[raw]),
    submitAlternative:async wire=>rpc(EF_ALTERNATIVE_ENDPOINT,'eth_sendFrameTransaction',[wire]),
    readState:async()=>{
      const pending=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionCount',[candidate.wallet,'pending']);
      return {pendingNonce:String(Number(BigInt(pending)))};
    },
    readCanonicalReceipt:async hash=>{
      const receipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]);
      return receipt??null;
    },
    readAlternativeReport:async hash=>rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[hash]),
  });
  let inclusion=null;
  let laterMempoolOutcome=result.alternativeReport?.admission?.outcome??result.alternativeReport?.entry?.status??null;
  if(result.alternative.status==='ACCEPTED'){
    try{
      const receipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[candidate.hash]);
      let frameReceipt=null;
      try{frameReceipt=await rpc(EF_CANONICAL_ENDPOINT,'eth_getFrameTransactionReceipt',[candidate.hash]);}catch{}
      inclusion={receipt,frameReceipt,blockNumber:receipt?.blockNumber??null,gasUsed:receipt?.gasUsed??null,status:receipt?.status??null};
      if(!receipt){
        for(let i=0;i<3&&!inclusion.blockNumber;i++){
          await new Promise(r=>setTimeout(r,2000));
          const again=await rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[candidate.hash]);
          if(again){inclusion={receipt:again,frameReceipt:null,blockNumber:again.blockNumber??null,gasUsed:again.gasUsed??null,status:again.status??null};break;}
          try{
            const report=await rpc(EF_ALTERNATIVE_ENDPOINT,'skandha_explorer_getTransaction',[candidate.hash]);
            laterMempoolOutcome=report?.admission?.outcome??report?.entry?.status??laterMempoolOutcome;
            if(laterMempoolOutcome==='dropped'||report?.entry?.status==='Cancelled')break;
          }catch{}
        }
      }
    }catch(e){inclusion={error:clean(e)};}
  }
  const admissionId=result.alternativeReport?.admission?.id??result.alternativeReport?.id??null;
  const publicReason=result.canonical.message??result.canonical.error??null;
  const inclusionStatus=inclusion?.blockNumber?'MINED'
    :/dropped|Cancelled/i.test(String(laterMempoolOutcome??''))?'DROPPED'
    :result.alternative.status==='ACCEPTED'?'ADMITTED_NOT_MINED'
    :'NOT_OBSERVED';
  const claims={
    ADMISSION_DIVERGENCE:result.divergence==='POLICY_DIVERGENCE',
    INCLUSION:Boolean(inclusion?.blockNumber),
    EXECUTION_SUCCESS:'NOT_OBSERVED',
  };
  const capturedAt=new Date().toISOString();
  return {
    ...result,
    provenance:'LIVE',
    observedAt:capturedAt,
    endpoints:{canonical:EF_CANONICAL_ENDPOINT,alternative:EF_ALTERNATIVE_ENDPOINT},
    inclusion,
    inclusionStatus,
    claims,
    laterMempoolOutcome,
    table:[{
      mutation:candidate.mutation,
      canonicalVerdict:result.canonical.status,
      publicVerdict:result.canonical.status,
      publicReason,
      alternativeVerdict:result.alternative.status,
      admissionId,
      divergence:result.divergence,
      policyDivergence:claims.ADMISSION_DIVERGENCE,
      inclusion:inclusion?.blockNumber??null,
      inclusionStatus,
      claims,
      evidence:{
        hash:candidate.hash,
        transactionHash:candidate.hash,
        sourceDigest:candidate.sourceDigest,
        wallet:candidate.wallet,
        sidecarAdmissionId:admissionId,
        rule:publicReason,
        timestamp:capturedAt,
        gasPaid:inclusion?.gasUsed??null,
        provenance:'LIVE',
        laterMempoolOutcome,
        rpc:{
          canonical:result.canonical,
          alternative:result.alternative,
          alternativeReportAdmission:result.alternativeReport?.admission??null,
        },
      },
    }],
  };
}
