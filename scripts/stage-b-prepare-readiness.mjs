#!/usr/bin/env node
/** Stage B PREPARE ONLY — read-only resolution. Never signs, broadcasts, funds, or publishes. */
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {keccak256} from 'viem';
import {prepareStageAManifest,approvalStop,capabilityModel} from '../src/live-readiness.mjs';
import {arkivClients,ARKIV_CHAIN_ID,ARKIV_RPC} from '../src/arkiv/client.mjs';
import {createRegistry} from '../src/arkiv/registry.mjs';
import {REGISTRY_SCHEMA} from '../src/arkiv/schema.mjs';
import {inspectUniswap} from '../src/adapters/uniswap-state.mjs';

const env=process.env;
const out={generatedAt:new Date().toISOString(),stage:'B_PREPARE_ONLY',writes:0,broadcasts:0,paidProviderCalls:0};

out.credentials={
  OPENROUTER_API_KEY:Boolean(env.OPENROUTER_API_KEY?.trim()),
  ARKIV_PRIVATE_KEY:Boolean(env.ARKIV_PRIVATE_KEY?.trim()),
  FRAMEFUZZ_DEPLOYER_KEY:Boolean(env.FRAMEFUZZ_DEPLOYER_KEY?.trim()),
  FRAMEFUZZ_RPC:Boolean(env.FRAMEFUZZ_RPC?.trim()),
  FRAMEFUZZ_PUBLIC_RPC:Boolean(env.FRAMEFUZZ_PUBLIC_RPC?.trim()),
  FRAMEFUZZ_ALT_RPC:Boolean(env.FRAMEFUZZ_ALT_RPC?.trim()),
  FRAMEFUZZ_LIVE_CONFIG:Boolean(env.FRAMEFUZZ_LIVE_CONFIG?.trim()),
};

const arkivManifest=prepareStageAManifest('ARKIV_PUBLISH');
const efManifest=prepareStageAManifest('EIP8141_UNISWAP_COMPARE');
out.manifests={arkiv:arkivManifest,ef:efManifest};
out.approvalStops={
  arkiv:approvalStop(arkivManifest.manifestDigest,'ARKIV_PUBLISH'),
  ef:approvalStop(efManifest.manifestDigest,'EIP8141_UNISWAP_COMPARE'),
};
out.capabilityModes={
  saved:capabilityModel({offlineDemo:true,env:{ARKIV_PRIVATE_KEY:'x',FRAMEFUZZ_DEPLOYER_KEY:'y',OPENROUTER_API_KEY:'z'}}),
  liveRead:capabilityModel({requestedMode:'LIVE_READ_ONLY',env}),
  liveAuth:capabilityModel({requestedMode:'LIVE_AUTHORIZED',env}),
};

async function eth(url,method,params=[]){
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const j=await r.json();
  if(j.error)throw new Error(j.error.message||'RPC error');
  return j.result;
}

const {publicClient}=arkivClients({readOnly:true});
const registry=createRegistry({publicClient,walletClient:null});
const arkiv={chainId:ARKIV_CHAIN_ID,rpc:ARKIV_RPC,keyConfigured:out.credentials.ARKIV_PRIVATE_KEY,writer:'UNRESOLVED'};
try{
  const block=await publicClient.getBlockNumber();
  const chain=await publicClient.getChainId();
  arkiv.liveChainId=chain;
  arkiv.latestBlock=String(block);
  arkiv.expiresAtBlockIfPublishedNow=String(block+43200n);
  arkiv.expirationBlocks=43200;
}catch(e){arkiv.blockError=String(e.message).slice(0,200);}
try{arkiv.gasPriceWei=String(await publicClient.getGasPrice());}
catch(e){arkiv.gasPriceError=String(e.message).slice(0,200);}

try{
  const hist=JSON.parse(await readFile('evidence/arkiv/2026-11-06/publish.json','utf8'));
  arkiv.historical={
    publisher:hist.publisher,
    entityKey:hist.entityKey,
    txHash:hist.transactionHash,
    contentDigest:hist.contentDigest,
    expiresAtBlock:hist.expiresAtBlock,
    gasUsed:hist.receipt?.gasUsed??null,
    effectiveGasPrice:hist.receipt?.effectiveGasPrice??null,
    status:hist.receipt?.status??null,
  };
  if(!arkiv.historical.gasUsed&&hist.transactionHash){
    try{
      const receipt=await publicClient.getTransactionReceipt({hash:hist.transactionHash});
      arkiv.historical.gasUsed=String(receipt.gasUsed);
      arkiv.historical.effectiveGasPrice=String(receipt.effectiveGasPrice??'');
      arkiv.historical.status=receipt.status;
    }catch(e){arkiv.historical.receiptFetchError=String(e.message).slice(0,160);}
  }
}catch(e){arkiv.historicalError=String(e.message).slice(0,160);}

try{
  const q=await registry.query({suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',limit:5});
  const cases=Array.isArray(q)?q:(q.cases??[]);
  arkiv.freshQuery={count:cases.length,sample:cases.slice(0,3).map(c=>({
    key:c.key??c.entityKey,
    owner:c.owner??c.publisher,
    contentDigest:c.record?.contentDigest??c.contentDigest,
    expiresAtBlock:c.expiresAtBlock??c.record?.expiration?.expiresAtBlock,
  }))};
}catch(e){arkiv.freshQueryError=String(e.message).slice(0,240);}

try{
  const reportPath='evidence/playground/2026-11-06/byoc-paid-report.json';
  const raw=await readFile(reportPath);
  const report=JSON.parse(raw);
  const case0=report.results?.[0];
  arkiv.sourceReport={
    path:reportPath,
    sha256:createHash('sha256').update(raw).digest('hex'),
    schema:report.schema,
    source:report.source,
    case0Id:case0?.id??null,
    hasReproduction:Boolean(case0?.reproduction||case0?.semanticDescriptor?.reproduction),
  };
  arkiv.sanitizedPayloadPreview={
    schemaVersion:REGISTRY_SCHEMA,
    caseVersion:1,
    suiteHint:case0?.family??case0?.mutation?.family??case0?.id??'unknown',
    caseIndex:0,
    expirationBlocks:43200,
    publisher:'UNRESOLVED_UNTIL_ARKIV_PRIVATE_KEY',
    contentDigest:'UNRESOLVED_UNTIL_PUBLISHER_BOUND',
    writerConfigured:false,
    note:'Payload contentDigest cannot be finalized until publisher address is derived from ARKIV_PRIVATE_KEY',
  };
  arkiv.schema={registrySchema:REGISTRY_SCHEMA,expirationBlocks:43200,flags:{readonly:true,permissionlessExtension:false}};
}catch(e){arkiv.sourceReportError=String(e.message).slice(0,240);}

if(arkiv.historical?.gasUsed&&arkiv.gasPriceWei){
  const gasUsed=BigInt(arkiv.historical.gasUsed);
  const gasPrice=BigInt(arkiv.gasPriceWei);
  arkiv.feeEstimate={
    basis:'historical_createEntity_gasUsed * current_gasPrice',
    historicalGasUsed:String(gasUsed),
    currentGasPriceWei:String(gasPrice),
    estimatedFeeWei:String(gasUsed*gasPrice),
    maximumTotalTestnetSpendWei:String(gasUsed*2n*gasPrice),
    note:'Estimate only; exact createEntity gas depends on payload size. Cap uses 2× historical gasUsed.',
  };
}else if(arkiv.gasPriceWei){
  const assumedGas=500000n;
  const gasPrice=BigInt(arkiv.gasPriceWei);
  arkiv.feeEstimate={
    basis:'assumed_500k_gas_cap * current_gasPrice',
    assumedGasLimit:String(assumedGas),
    currentGasPriceWei:String(gasPrice),
    estimatedFeeWei:String(assumedGas*gasPrice),
    maximumTotalTestnetSpendWei:String(assumedGas*gasPrice),
  };
}
arkiv.nonce='UNRESOLVED_WITHOUT_WRITER_ADDRESS';
arkiv.duplicateCheck=arkiv.freshQuery
  ?{status:'FRESH_QUERY_OK',note:'No writer-bound contentDigest yet; cannot assert exact duplicate of pending publication'}
  :{status:'QUERY_FAILED',error:arkiv.freshQueryError??null};

if(!out.credentials.ARKIV_PRIVATE_KEY)arkiv.classification='BLOCKED_MISSING_KEY';
else if(arkiv.liveChainId!==ARKIV_CHAIN_ID||arkiv.blockError)arkiv.classification='BLOCKED_NETWORK';
else if(arkiv.sourceReportError||!arkiv.sourceReport?.hasReproduction)arkiv.classification='BLOCKED_SCHEMA';
else arkiv.classification='READY_FOR_EXPLICIT_APPROVAL';
out.arkiv=arkiv;

const EF_RPC='https://altmempool.forshtat.com/rpc/';
const EF_EXEC='https://altmempool.forshtat.com';
const config=JSON.parse(await readFile('examples/live/devnet.json','utf8'));
const ef={chainId:1337,admissionRpc:EF_RPC,executionRpc:EF_EXEC,keyConfigured:out.credentials.FRAMEFUZZ_DEPLOYER_KEY,configPath:'examples/live/devnet.json'};

try{
  const [chainId,blockNumber,clientVersion]=await Promise.all([
    eth(EF_RPC,'eth_chainId'),eth(EF_RPC,'eth_blockNumber'),eth(EF_RPC,'web3_clientVersion'),
  ]);
  let gasPriceWei=null,gasPriceError=null;
  try{gasPriceWei=String(BigInt(await eth(EF_RPC,'eth_gasPrice')));}
  catch(e){gasPriceError=String(e.message).slice(0,160);}
  ef.head={chainId:Number.parseInt(chainId,16),blockNumber:Number.parseInt(blockNumber,16),blockNumberHex:blockNumber,clientVersion,gasPriceWei,gasPriceError};
}catch(e){ef.headError=String(e.message).slice(0,200);}

try{
  await new Promise(r=>setTimeout(r,1500));
  const b2=await eth(EF_RPC,'eth_blockNumber');
  ef.head2={blockNumber:Number.parseInt(b2,16),advancing:ef.head?Number.parseInt(b2,16)>ef.head.blockNumber:null};
}catch(e){ef.head2Error=String(e.message).slice(0,160);}

ef.contracts={};
for(const [role,address] of Object.entries({
  basic:config.paymasters.basic,
  staked:config.paymasters.staked,
  unstaked:config.paymasters.unstaked,
  stateView:config.stateView,
  poolManager:config.poolManager,
  stakingRegistry:config.stakingRegistry,
  recipient:config.recipient,
})){
  try{
    const code=await eth(EF_RPC,'eth_getCode',[address,'latest']);
    const bal=await eth(EF_RPC,'eth_getBalance',[address,'latest']);
    const codeHash=(!code||code==='0x')?'EMPTY':keccak256(code);
    const expected=config.paymasterCodeHashes?.[role]||config.uniswapCodeHashes?.[role]||null;
    ef.contracts[role]={
      address,
      balanceWei:String(BigInt(bal)),
      codeBytes:code&&code!=='0x'?(code.length-2)/2:0,
      codeHash,
      expectedCodeHash:expected,
      codeMatchesExpected:expected?codeHash===expected:null,
    };
  }catch(e){ef.contracts[role]={address,error:String(e.message).slice(0,160)};}
}

try{ef.uniswap=await inspectUniswap(config,EF_RPC);}
catch(e){ef.uniswapError=String(e.message).slice(0,240);}

ef.sender='UNRESOLVED_WITHOUT_FRAMEFUZZ_DEPLOYER_KEY';
ef.payer=config.paymasters.basic;
ef.poolId=config.poolId;
ef.nonce='UNRESOLVED_WITHOUT_SENDER';
ef.methods=efManifest.methods;
ef.sigContext={
  public:'eth_sendRawTransaction',
  alternative:'eth_sendFrameTransaction',
  note:'Independent nonce/sender isolation required across public vs alt paths; identical signed bytes must not be dual-submitted',
};
ef.maxFee={
  basis:'2 gwei × 500000 gas per path × 2 paths (public+alt); excludes redeploy/stake/funding',
  maxFeePerGasWei:'2000000000',
  perPathMaximumWei:'1000000000000000',
  maximumTotalTestnetSpendWei:'2000000000000000',
};
ef.historicalScenarioRecreation={
  targetCase:'uniswap-v4-paymaster basic-sponsorship-smallest-historical-profile',
  basicPaymasterCodePresent:Boolean(ef.contracts.basic?.codeBytes>0),
  basicPaymasterCodeMatches:ef.contracts.basic?.codeMatchesExpected===true,
  basicPaymasterBalanceWei:ef.contracts.basic?.balanceWei??null,
  stateViewMatches:ef.contracts.stateView?.codeMatchesExpected===true,
  poolManagerMatches:ef.contracts.poolManager?.codeMatchesExpected===true,
  slot0Initialized:ef.uniswap?.slot0?.initialized??null,
  slot0:ef.uniswap?.slot0??null,
  blockerNotes:[],
};
if(!out.credentials.FRAMEFUZZ_DEPLOYER_KEY)ef.historicalScenarioRecreation.blockerNotes.push('FRAMEFUZZ_DEPLOYER_KEY missing');
if(!(BigInt(ef.contracts.basic?.balanceWei??0)>0n))ef.historicalScenarioRecreation.blockerNotes.push('basic paymaster balance is 0');
if(!(ef.contracts.basic?.codeBytes>0))ef.historicalScenarioRecreation.blockerNotes.push('basic paymaster code empty');
if(ef.contracts.basic?.codeMatchesExpected===false)ef.historicalScenarioRecreation.blockerNotes.push('basic paymaster code hash mismatch');
if(!ef.uniswap)ef.historicalScenarioRecreation.blockerNotes.push('Uniswap StateView/getSlot0 inspection failed: '+(ef.uniswapError||'unknown'));

const basicMissing=!(ef.contracts.basic?.codeBytes>0);
if(!out.credentials.FRAMEFUZZ_DEPLOYER_KEY)ef.classification='BLOCKED_MISSING_KEY';
else if(ef.headError||ef.head?.chainId!==1337)ef.classification='BLOCKED_NETWORK';
else if(basicMissing)ef.classification='BLOCKED_OTHER';
else if(!(BigInt(ef.contracts.basic?.balanceWei??0)>0n))ef.classification='BLOCKED_MISSING_FUNDS';
else ef.classification='READY_FOR_EXPLICIT_APPROVAL';

if(basicMissing){
  ef.paymasterBlock='PINNED_BASIC_PAYMASTER_CODE_EMPTY_OR_MISSING';
  ef.ownedValidatorPrerequisitesIfSwitching=[
    'Separate explicit approval for owned-validator path (not this Uniswap compare manifest)',
    'FRAMEFUZZ_DEPLOYER_KEY funded >= 0.064 test ETH for Phase3-style deploy+submit caps',
    'Deploy ActionRecorder + four isolated sender validators (predicted CREATE addresses)',
    'Fresh nonce/funding/code checks per sender',
    'Runtime client vector / ethrex compatibility verification',
    'New manifest digest distinct from EIP8141_UNISWAP_COMPARE',
    'Sponsor restoration NOT authorized as silent substitute for missing Uniswap paymaster',
  ];
}
out.ef=ef;

out.liveAuthorizedBoundary={
  howStarted:'node bin/framefuzz.mjs serve --mode LIVE_AUTHORIZED --submit --rpc <url> --allow-chain <id>',
  submitEnabledRequires:['capabilities.mode===LIVE_AUTHORIZED','CLI --submit','rpc configured','allowChainId in EXECUTION_CHAINS'],
  capabilityModelWritesEnabledAlwaysFalse:true,
  approvalEndpointIssuesToken:false,
  approvalHttpStatus:409,
  approvalRequires:['operation','exact 64-hex manifestDigest'],
  oneTime:true,
  savedDemoCannotWrite:out.capabilityModes.saved.writesEnabled===false&&out.capabilityModes.saved.readOnlyNetwork===false,
  changedDigestNeedsReapproval:true,
  noGlobalWriteBypass:true,
  unknownOutcomeReconciliation:'Manifest pathways include reconcile/verify; Stage B prepare does not implement write executor',
};

await mkdir('runs',{recursive:true});
const text=JSON.stringify(out,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n';
await writeFile('runs/stage-b-prepare-readiness.json',text);
console.log(text);
