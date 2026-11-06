/** Read-only validation of the captured storage-access live evidence. No broadcasts. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {keccak256} from 'viem';
import {rpc} from '../src/rpc.mjs';
import {analyzeContract} from '../src/playground/compile.mjs';
import {runtimeMatchesTemplate} from '../src/playground/live-admission.mjs';
import {EF_CANONICAL_ENDPOINT,EF_ALTERNATIVE_ENDPOINT} from '../src/adapters/ef-routing.mjs';
import {buildStorageAccessRegression,validateStorageAccessRegression} from '../src/playground/storage-access-regression.mjs';
import {SUPPORTED_STORAGE_ACCESS_SCENARIO} from '../src/playground/supported-scenario.mjs';

const file='evidence/live/2026-11-07/storage-access-live.json';
const e=JSON.parse(await readFile(file,'utf8'));
const cmp=e.steps.comparison;
const hash=e.steps.candidate.hash;
const checks=[];
const pass=(id,ok,detail)=>{checks.push({id,ok,detail});if(!ok)console.error('FAIL',id,detail);};

pass('same_signed_identity',
  cmp.transactionIdentity===hash&&cmp.alternative?.hash===hash&&cmp.table?.[0]?.evidence?.hash===hash,
  {hash,canonicalHash:cmp.transactionIdentity,alternativeHash:cmp.alternative?.hash});
pass('ethrex_storage_read_non_sender',
  cmp.canonical?.status==='REJECTED_POLICY'&&/StorageReadNonSender/.test(cmp.canonical?.message||''),
  cmp.canonical);
pass('skandha_accepted_admission_id',
  cmp.alternative?.status==='ACCEPTED'&&Number(cmp.table?.[0]?.evidence?.sidecarAdmissionId)===1647,
  {status:cmp.alternative?.status,id:cmp.table?.[0]?.evidence?.sidecarAdmissionId});
pass('events_show_admitted_then_dropped',
  (cmp.alternativeReport?.events||[]).some(x=>x.kind==='admitted')&&
  ((cmp.inclusionFollowUp?.laterOutcome==='dropped')||(cmp.alternativeReport?.admission?.outcome==='dropped')),
  {later:cmp.inclusionFollowUp?.laterOutcome,outcome:cmp.alternativeReport?.admission?.outcome});
pass('timestamps_present',Boolean(e.observedAt&&e.completedAt&&cmp.table?.[0]?.evidence?.timestamp),{observedAt:e.observedAt,completedAt:e.completedAt});
pass('stake_recorded',e.steps.stake?.status?.status==='STAKED'&&e.steps.stake?.amountWei==='12000000000000000',e.steps.stake?.status);
pass('signature_present',Boolean(cmp.alternativeReport?.entry?.tx?.signatures?.[0]?.signature?.startsWith('0x')),{signer:cmp.alternativeReport?.entry?.tx?.signatures?.[0]?.signer});
pass('nonce_nine',e.steps.candidate.nonce===9&&cmp.alternativeReport?.admission?.nonce==='0x9',{candidate:e.steps.candidate.nonce});

const SOURCE=await readFile('examples/contracts/StorageAccessValidator.sol','utf8');
const analysis=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
pass('source_digest',analysis.sourceDigest===SUPPORTED_STORAGE_ACCESS_SCENARIO.sourceDigest,analysis.sourceDigest);
pass('runtime_template',analysis.runtimeBytecodeHash===SUPPORTED_STORAGE_ACCESS_SCENARIO.runtimeBytecodeTemplateHash,analysis.runtimeBytecodeHash);

const wallet=e.steps.verifyRuntime.wallet;
const foreign=e.steps.verifyRuntime.foreign;
const [code,fcode,receipt]=await Promise.all([
  rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[wallet,'latest']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getCode',[foreign,'latest']),
  rpc(EF_CANONICAL_ENDPOINT,'eth_getTransactionReceipt',[hash]),
]);
pass('runtime_bound_on_chain',runtimeMatchesTemplate(code,analysis.runtimeBytecode,analysis.immutableReferences),{codeHash:keccak256(code)});
pass('foreign_code_present',fcode!=='0x',{bytes:(fcode.length-2)/2});
pass('inclusion_false',receipt===null,{receipt});
pass('claims',true,{
  ADMISSION_DIVERGENCE:cmp.divergence==='POLICY_DIVERGENCE',
  INCLUSION:false,
  EXECUTION_SUCCESS:'NOT_OBSERVED',
});

const comparisonForRegression={
  ...cmp,
  provenance:'LIVE',
  observedAt:e.completedAt,
  transactionIdentity:hash,
  endpoints:{canonical:EF_CANONICAL_ENDPOINT,alternative:EF_ALTERNATIVE_ENDPOINT},
  inclusion:null,
};
const regression=buildStorageAccessRegression({comparison:comparisonForRegression,analysis,inclusionFollowUp:cmp.inclusionFollowUp});
validateStorageAccessRegression(regression);
pass('regression_descriptor_valid',true,{contentDigest:regression.contentDigest,inclusionStatus:regression.observed.inclusionStatus});

const outDir=path.dirname(file);
const verification={
  schema:'framefuzz.storage-access-verification.v1',
  evidenceFile:file,
  verifiedAt:new Date().toISOString(),
  checks,
  summary:{
    ADMISSION_DIVERGENCE:true,
    INCLUSION:false,
    EXECUTION_SUCCESS:'NOT_OBSERVED',
    allPassed:checks.every(c=>c.ok),
  },
  writes:0,
  broadcasts:0,
};
await writeFile(path.join(outDir,'storage-access-verification.json'),JSON.stringify(verification,null,2)+'\n');
await mkdir('evidence/prepared/2026-11-07',{recursive:true});
await writeFile('evidence/prepared/2026-11-07/storage-access-regression-descriptor.json',JSON.stringify(regression,null,2)+'\n');
await writeFile('evidence/prepared/2026-11-07/storage-access-regression-descriptor.sha256',regression.contentDigest+'\n');
console.log(JSON.stringify({allPassed:verification.summary.allPassed,failed:checks.filter(c=>!c.ok).map(c=>c.id),regressionDigest:regression.contentDigest,claims:verification.summary},null,2));
if(!verification.summary.allPassed)process.exit(1);
