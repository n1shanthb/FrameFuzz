import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyzeContract} from '../src/playground/compile.mjs';
import {SUPPORTED_STORAGE_ACCESS_SCENARIO,matchesSupportedScenario} from '../src/playground/supported-scenario.mjs';
import {buildStorageAccessRegression,validateStorageAccessRegression} from '../src/playground/storage-access-regression.mjs';
import {runtimeMatchesTemplate} from '../src/playground/live-admission.mjs';
import {validateRegressionCase} from '../src/arkiv/case.mjs';
import {REGISTRY_SCHEMA} from '../src/arkiv/schema.mjs';

const SOURCE=readFileSync(new URL('../examples/contracts/StorageAccessValidator.sol',import.meta.url),'utf8');

test('supported scenario binds exact source digest and runtime template',async()=>{
  const a=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
  assert.equal(a.sourceDigest,SUPPORTED_STORAGE_ACCESS_SCENARIO.sourceDigest);
  assert.equal(a.runtimeBytecodeHash,SUPPORTED_STORAGE_ACCESS_SCENARIO.runtimeBytecodeTemplateHash);
  assert.equal(matchesSupportedScenario(a),true);
  assert.equal(SUPPORTED_STORAGE_ACCESS_SCENARIO.kind,'SUPPORTED_SCENARIO_NOT_ARBITRARY_BYOC');
  assert.ok(a.immutableReferences);
  assert.equal(runtimeMatchesTemplate(a.runtimeBytecode,a.runtimeBytecode,a.immutableReferences),true);
});

test('storage-access regression descriptor encodes claims without claiming inclusion/execution',async()=>{
  const a=await analyzeContract({source:SOURCE,contractName:'ViolatingWallet'});
  const comparison={
    provenance:'LIVE',
    observedAt:'2026-11-06T22:31:23.717Z',
    transactionIdentity:'0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d',
    divergence:'POLICY_DIVERGENCE',
    canonical:{status:'REJECTED_POLICY',errorClass:'admission_policy',message:'Invalid params: Frame transaction validation-prefix simulation failed: StorageReadNonSender'},
    alternative:{status:'ACCEPTED',hash:'0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d',message:'Submission RPC returned a transaction hash; inclusion NOT implied.'},
    alternativeReport:{admission:{id:1647,outcome:'dropped'}},
    inclusion:null,
    endpoints:{canonical:'https://altmempool.forshtat.com',alternative:'https://altmempool.forshtat.com/rpc/'},
    table:[{mutation:'ViolatingWallet VERIFY data triggers FOREIGN.staticcall (StorageReadNonSender vs staked alt admit)',canonicalVerdict:'REJECTED_POLICY',alternativeVerdict:'ACCEPTED',divergence:'POLICY_DIVERGENCE',evidence:{hash:'0xf69e0f4b87827d8d5d295188d10e7672b2bace87e6ac8d09916758bee155e31d',sourceDigest:a.sourceDigest,wallet:SUPPORTED_STORAGE_ACCESS_SCENARIO.fixtures.wallet,sidecarAdmissionId:1647,timestamp:'2026-11-06T22:31:23.717Z',provenance:'LIVE',laterMempoolOutcome:'dropped'}}],
  };
  const record=buildStorageAccessRegression({comparison,analysis:a,inclusionFollowUp:{laterOutcome:'dropped'}});
  assert.doesNotThrow(()=>validateStorageAccessRegression(record));
  assert.equal(record.observed.claims.ADMISSION_DIVERGENCE,true);
  assert.equal(record.observed.claims.INCLUSION,false);
  assert.equal(record.observed.claims.EXECUTION_SUCCESS,'NOT_OBSERVED');
  assert.equal(record.observed.inclusionStatus,'DROPPED');
  assert.equal(record.arkivPublication.status,'AWAITING_EXPLICIT_USER_APPROVAL');
  assert.equal(record.arkivPublication.broadcasts,0);
  assert.equal(record.observed.public.rule,'StorageReadNonSender');
});

test('existing Arkiv regression schema constant remains framefuzz.regression.v1',()=>{
  assert.equal(REGISTRY_SCHEMA,'framefuzz.regression.v1');
  assert.equal(typeof validateRegressionCase,'function');
});
