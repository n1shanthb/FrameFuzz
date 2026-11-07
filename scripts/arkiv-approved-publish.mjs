#!/usr/bin/env node
/**
 * ONE-SHOT Arkiv createEntity under intent/envelope approval.
 * Preflight always rechecks. Submit requires APPROVED_INTENT_DIGEST to be set
 * to the exact approved intent digest after explicit user approval.
 * Never auto-retries; uncertain broadcasts must be reconciled.
 */
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createPublicClient,http,formatEther,stringToBytes} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {ExpirationTime} from '@arkiv-network/sdk';
import {addr,u64} from '@arkiv-network/sdk/schema';
import {ARKIV_CHAIN_ID,ARKIV_RPC,arkivClients} from '../src/arkiv/client.mjs';
import {buildRegressionCase} from '../src/arkiv/case.mjs';
import {createRegistry} from '../src/arkiv/registry.mjs';
import {RegressionCases,REGISTRY_SCHEMA} from '../src/arkiv/schema.mjs';
import {
  buildImmutableIntent,
  evaluateApprovalGate,
} from '../src/arkiv/approval-gate.mjs';
import {stringify} from '../src/arkiv/cli.mjs';

/** Candidate packet values (review). Submit stays locked until APPROVED_INTENT_DIGEST is set. */
const CANDIDATE={
  writer:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',
  contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
  maxFeeEther:'0.001',
  sourceReport:'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
  expirationBlocks:43200,
  expiresAtBlock:'345303',
  caseIndex:0,
  suite:'verification-gas',
  ruleId:'MAX_VERIFY_GAS',
  expectedNonce:0,
};

/** One-shot consumed after successful publish of intent be8bb848…40ff4. null = locked. */
const APPROVED_INTENT_DIGEST=null;

const mode=process.argv[2]??'preflight';
if(!['preflight','submit'].includes(mode))throw new Error('Usage: node --env-file=.env scripts/arkiv-approved-publish.mjs <preflight|submit>');

const key=process.env.ARKIV_PRIVATE_KEY;
if(!/^0x[\da-fA-F]{64}$/.test(key||''))throw new Error('ARKIV_PRIVATE_KEY missing — load via --env-file=.env');
const account=privateKeyToAccount(key);

const reportRaw=await readFile(CANDIDATE.sourceReport);
const report=JSON.parse(reportRaw);

const publicProbe=createPublicClient({transport:http(ARKIV_RPC)});
const [chainId,balance,nonce,gasPrice]=await Promise.all([
  publicProbe.getChainId(),
  publicProbe.getBalance({address:account.address}),
  publicProbe.getTransactionCount({address:account.address}),
  publicProbe.getGasPrice(),
]);

const {publicClient,walletClient}=arkivClients({readOnly:false});
if(await publicClient.getChainId()!==ARKIV_CHAIN_ID)throw new Error('Arkiv SDK chain mismatch');
const timing=await publicClient.getBlockTiming();
const currentBlock=timing.currentBlock;

const evidenceDigest=createHash('sha256').update(JSON.stringify(report)).digest('hex');
const record=buildRegressionCase({
  report,
  caseIndex:CANDIDATE.caseIndex,
  publisher:account.address,
  expirationBlocks:CANDIDATE.expirationBlocks,
  expiresAtBlock:BigInt(CANDIDATE.expiresAtBlock),
  evidenceDigest,
});

const approvedIntent=buildImmutableIntent({
  writer:CANDIDATE.writer,
  contentDigest:CANDIDATE.contentDigest,
  sourceReport:CANDIDATE.sourceReport,
  caseIndex:CANDIDATE.caseIndex,
  suite:CANDIDATE.suite,
  ruleId:CANDIDATE.ruleId,
  expirationBlocks:CANDIDATE.expirationBlocks,
  expiresAtBlock:CANDIDATE.expiresAtBlock,
});

const registry=createRegistry({publicClient,walletClient});
const prior=await registry.query({suite:CANDIDATE.suite,ruleId:CANDIDATE.ruleId,owner:account.address,limit:5});
const anyPrior=await registry.query({suite:CANDIDATE.suite,ruleId:CANDIDATE.ruleId,limit:5});
const duplicate=[...prior.cases,...anyPrior.cases].some(c=>c.record.contentDigest===CANDIDATE.contentDigest);
const uncertainPriorBroadcast=Number(nonce)>CANDIDATE.expectedNonce&&!duplicate;

const gate=evaluateApprovalGate({
  approvedIntent,
  approvedMaxFeeEther:CANDIDATE.maxFeeEther,
  expectedNonce:CANDIDATE.expectedNonce,
  live:{
    chainId,
    writer:account.address,
    nonce:Number(nonce),
    balanceWei:balance.toString(),
    gasPriceWei:gasPrice.toString(),
    currentBlock:currentBlock.toString(),
  },
  rebuilt:{
    chainId:ARKIV_CHAIN_ID,
    rpc:ARKIV_RPC,
    writer:account.address,
    contentDigest:record.contentDigest,
    sourceReport:CANDIDATE.sourceReport,
    caseIndex:CANDIDATE.caseIndex,
    suite:record.suite,
    ruleId:record.ruleId,
    expirationBlocks:CANDIDATE.expirationBlocks,
    expiresAtBlock:record.expiration.expiresAtBlock,
  },
  duplicate,
  uncertainPriorBroadcast,
});

const preflight={
  mode,
  at:new Date().toISOString(),
  candidate:CANDIDATE,
  intentDigest:approvedIntent.intentDigest,
  approvedIntentDigestConfigured:APPROVED_INTENT_DIGEST,
  live:{
    chainId,
    currentBlock:currentBlock.toString(),
    nonce:Number(nonce),
    balanceEther:formatEther(balance),
    gasPriceWei:gasPrice.toString(),
    writer:account.address,
  },
  rebuilt:{
    contentDigest:record.contentDigest,
    expiresAtBlock:record.expiration.expiresAtBlock,
    evidenceDigest,
    suite:record.suite,
    ruleId:record.ruleId,
  },
  gate,
  priorOwnerCases:prior.cases.map(c=>({key:c.key,contentDigest:c.record.contentDigest})),
  duplicate,
  uncertainPriorBroadcast,
  submitPolicy:{
    requiresExactIntentDigest:true,
    approvedIntentDigestSet:Boolean(APPROVED_INTENT_DIGEST),
    autoRetry:false,
  },
};

await mkdir('runs/arkiv-approved',{recursive:true});
await writeFile('runs/arkiv-approved/preflight-v2.json',stringify(preflight)+'\n');

console.log(stringify({
  status:gate.status,
  intentDigest:approvedIntent.intentDigest,
  submitAllowedByGate:gate.submitAllowed,
  submitUnlocked:Boolean(APPROVED_INTENT_DIGEST)&&APPROVED_INTENT_DIGEST===approvedIntent.intentDigest,
  blockers:gate.blockers,
  envelope:gate.envelope&&{
    maxFeeEther:gate.envelope.maxFeeEther,
    projectedMaximumFeeEther:gate.envelope.projectedMaximumFeeEther,
    gasPriceWei:gate.envelope.gasPriceWei,
  },
}));

if(!gate.submitAllowed){
  process.exitCode=2;
  throw new Error('STOP: '+gate.status+' — '+(gate.blockers?.join(', ')||gate.reason||'blocked'));
}

if(mode!=='submit')process.exit(0);

if(!APPROVED_INTENT_DIGEST||APPROVED_INTENT_DIGEST!==approvedIntent.intentDigest){
  throw new Error(`STOP: submit locked — set APPROVED_INTENT_DIGEST to ${approvedIntent.intentDigest} only after explicit user approval`);
}

const values={
  caseVersion:u64(1n),
  suite:record.suite,
  family:record.mutationFamily,
  ruleId:record.ruleId,
  implementation:record.implementationVersion,
  publisher:addr(record.publisher),
  classification:record.evidence.classification,
  contentDigest:record.contentDigest,
  expiresAtBlock:u64(BigInt(record.expiration.expiresAtBlock)),
  record:stringToBytes(JSON.stringify(record)),
};

let created;
try{
  created=await walletClient.createEntity(RegressionCases,values,{
    expiration:ExpirationTime.atBlock(BigInt(record.expiration.expiresAtBlock)),
    flags:{readonly:true,permissionlessExtension:false},
  });
}catch(error){
  await writeFile('runs/arkiv-approved/broadcast-error.json',stringify({
    status:'BROADCAST_FAILED_RECONCILE_DO_NOT_RETRY',
    message:String(error.message),
    intentDigest:approvedIntent.intentDigest,
    contentDigest:record.contentDigest,
  })+'\n');
  throw error;
}

const receipt=await publicClient.getTransactionReceipt({hash:created.txHash});
if(receipt.status!=='success'||receipt.transactionHash.toLowerCase()!==created.txHash.toLowerCase()){
  await writeFile('runs/arkiv-approved/uncertain-receipt.json',stringify({created,receipt,intentDigest:approvedIntent.intentDigest})+'\n');
  throw new Error('STOP: receipt did not validate; reconcile — do not retry automatically');
}
if(String(created.expiresAt)!==record.expiration.expiresAtBlock){
  throw new Error('STOP: on-chain expiry mismatch; reconcile — do not retry');
}
if(record.contentDigest!==CANDIDATE.contentDigest){
  throw new Error('STOP: contentDigest drifted; reconcile — do not retry');
}

const published={
  registrySchema:REGISTRY_SCHEMA,
  chainId:ARKIV_CHAIN_ID,
  rpc:ARKIV_RPC,
  entityKey:created.entityKey,
  transactionHash:created.txHash,
  expiresAtBlock:String(created.expiresAt),
  publisher:record.publisher,
  contentDigest:record.contentDigest,
  intentDigest:approvedIntent.intentDigest,
  record,
  receipt:{
    status:receipt.status,
    blockNumber:receipt.blockNumber?.toString?.()??String(receipt.blockNumber),
    gasUsed:receipt.gasUsed?.toString?.()??String(receipt.gasUsed),
    effectiveGasPrice:receipt.effectiveGasPrice?.toString?.()??null,
    transactionHash:receipt.transactionHash,
  },
};

await writeFile('runs/arkiv-approved/receipt.json',stringify(published)+'\n');
const fetched=await registry.fetch(published.entityKey);
const imported=await registry.importPreview(published.entityKey);
if(imported.preview.submissions!==0)throw new Error('Import preview attempted submission');

await mkdir('evidence/arkiv/2026-11-07',{recursive:true});
await writeFile('evidence/arkiv/2026-11-07/publish-receipt.json',stringify(published)+'\n');
await writeFile('evidence/arkiv/2026-11-07/fresh-fetch.json',stringify({
  key:fetched.key,owner:fetched.owner,creator:fetched.creator,
  expiresAtBlock:fetched.expiresAtBlock,contentDigest:fetched.record.contentDigest,
  verification:fetched.verification,
})+'\n');
await writeFile('evidence/arkiv/2026-11-07/unsigned-import-preview.json',stringify({
  source:imported.preview.source,
  submissions:imported.preview.submissions,
  communityOrigin:imported.preview.communityOrigin,
})+'\n');

console.log(stringify({
  status:'PUBLISHED_AND_VERIFIED',
  transactionHash:published.transactionHash,
  entityKey:published.entityKey,
  contentDigest:published.contentDigest,
  intentDigest:approvedIntent.intentDigest,
  receiptStatus:published.receipt.status,
  fetch:{owner:fetched.owner,contentDigest:fetched.record.contentDigest,expiresAtBlock:fetched.expiresAtBlock},
  importPreview:{source:imported.preview.source,submissions:imported.preview.submissions},
}));
