import test from 'node:test';
import assert from 'node:assert/strict';
import {contractInput,analysisContext,digest,normalizedResult} from '../src/analysis/model.mjs';
import {prepareContractAnalysis,generateSemanticTests,evaluateSemanticTest,supportedContext} from '../src/analysis/service.mjs';
import {adaptHistoricalGasCase,adaptOwnedExperiment,unsupportedContractExample} from '../src/analysis/fixtures.mjs';

const source=()=>({schema:'framefuzz.contract-input.v1',kind:'SOLIDITY_SOURCE',source:{fileId:'A.sol',content:'contract A {}'}});
test('contract identity is content based, bounded and versioned',()=>{
 const a=source(),b=source();b.source.fileId='Other.sol';
 assert.equal(contractInput(a).contentDigest,contractInput(b).contentDigest);
 assert.equal(digest({a:1,b:2}),digest({b:2,a:1}));
 assert.throws(()=>contractInput({...a,schema:'future'}));
 assert.throws(()=>contractInput({...a,contentDigest:'forged'}));
 a.source.content='x'.repeat(65537);assert.throws(()=>contractInput(a));
});
test('contexts reject credentials, unsupported state claims and cyclic input',()=>{
 assert.throws(()=>analysisContext({schema:'framefuzz.analysis-context.v1',endpointIdentity:'https://user:pass@example.com'}));
 assert.throws(()=>analysisContext({schema:'framefuzz.analysis-context.v1',funding:{status:'VERIFIED'}}));
 const a=source();a.loop=a;assert.throws(()=>contractInput(a));
 assert.throws(()=>contractInput({...source(),privateKey:'secret'}));
});
test('ordinary Solidity remains unverified with explicit prerequisites',async()=>{
 const {prepared,result}=await unsupportedContractExample();assert.deepEqual(prepared.capabilities,[]);
 assert.equal(result.classification,'UNVERIFIED');assert.equal(result.actual,null);
 await assert.rejects(generateSemanticTests(prepared),{code:'MISSING_PREREQUISITES'});
});
test('declared validator roles and filenames do not unlock cryptographic analysis',async()=>{
 const a=source();a.source.fileId='SenderValidatorUnsafe.sol';a.role='SENDER_VALIDATOR';
 const p=await prepareContractAnalysis(a,supportedContext());assert.deepEqual(p.capabilities,[]);
 assert.ok(p.missingPrerequisites.includes('KNOWN_OWNED_VALIDATOR_SOURCE'));
});
test('context mismatches and ignored target overrides disable capability',async()=>{
 const {prepared}=await adaptHistoricalGasCase();
 for(const context of [{...supportedContext(),chainId:1},{...supportedContext(),profile:'other'},{...supportedContext(),frameLayout:supportedContext().frameLayout.map(f=>({...f,target:null}))}]){
  const p=await prepareContractAnalysis(prepared.contract,context);assert.deepEqual(p.capabilities,[]);
 }
});
test('gas adaptation separates captured observations from new unsigned predictions',async()=>{
 const {test:spec,preview,historical}=await adaptHistoricalGasCase();
 assert.equal(spec.modifiedInput.verificationGasLimit,67198);assert.equal(preview.actual,null);
 assert.equal(preview.classification,'POLICY_PREDICTION');assert.equal(historical.classification,'HISTORICAL_LIVE');
 assert.deepEqual(historical.actual.paths.map(p=>p.admission.status),['accepted','accepted']);
 assert.deepEqual(await evaluateSemanticTest(JSON.parse(JSON.stringify(spec)),'POLICY_PREDICTION'),preview);
 await assert.rejects(evaluateSemanticTest(spec,'CURRENT_LIVE'),{code:'UNSUPPORTED_MODE'});
 const forged=structuredClone(spec);forged.expectedObservation={status:'accepted'};const {descriptorHash,...body}=forged;forged.descriptorHash=digest(body);
 await assert.rejects(evaluateSemanticTest(forged,'POLICY_PREDICTION'),{code:'SPEC_MISMATCH'});
 assert.throws(()=>normalizedResult({...preview,actual:{admission:'accepted'}}),{code:'PROVENANCE_MISMATCH'});
});
test('owned fixture actually recomputes record(2,10) crypto without network calls',async()=>{
 const saved=process.env.FRAMEFUZZ_SWARM,fetch=globalThis.fetch;process.env.FRAMEFUZZ_SWARM='on';globalThis.fetch=()=>{throw Error('network forbidden');};
 try{
  const {test:spec,result}=await adaptOwnedExperiment();
  assert.equal(spec.modifiedInput.operation,2);assert.equal(spec.modifiedInput.parameter,10);
  assert.equal(result.actual.semanticProperties.unsafe.tamperedOwnerRecovered,true);
  assert.equal(result.actual.semanticProperties.safe.tamperedOwnerRecovered,false);
  assert.equal(result.actual.finding,false);assert.equal(result.execution.broadcasts,0);
  const again=await evaluateSemanticTest(spec,'OFFLINE_EXECUTED');assert.deepEqual(again.actual,result.actual);
  const prepared=await prepareContractAnalysis(spec.contract,spec.context);
  const [different]=await generateSemanticTests(prepared,{operation:3,parameter:11});
  const changed=await evaluateSemanticTest(different,'OFFLINE_EXECUTED');
  assert.notEqual(changed.actual.canonicalHashes.safe.modified,result.actual.canonicalHashes.safe.modified);
 }finally{globalThis.fetch=fetch;if(saved===undefined)delete process.env.FRAMEFUZZ_SWARM;else process.env.FRAMEFUZZ_SWARM=saved;}
});
