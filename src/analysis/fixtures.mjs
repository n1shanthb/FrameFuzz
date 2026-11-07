import {readFile} from 'node:fs/promises';
import {prepareContractAnalysis,generateSemanticTests,evaluateSemanticTest,supportedContext,analysisResult} from './service.mjs';
import {normalizedResult,sha256,fail,digest} from './model.mjs';
import {compileOwnedFixtures} from '../swarm/compile.mjs';
import {frameDigest} from '../mutations/frames.mjs';
const GAS='evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json';
const SONNET='evidence/investigator/2026-11-06/sonnet-retry-2.json';
const json=async file=>JSON.parse(await readFile(new URL('../../'+file,import.meta.url),'utf8'));
async function capture(file,expected){const bytes=await readFile(new URL('../../'+file,import.meta.url));fail(sha256(bytes)===expected,'CAPTURE_DIGEST','Canonical capture changed');return {report:JSON.parse(bytes),reference:{file,sha256:expected}};}
/** Known capture adaptation, not an arbitrary path/JSON loader or a fresh live evaluator. */
export async function adaptHistoricalGasCase(index=0){
 fail(Number.isSafeInteger(index)&&index>=0&&index<7,'INPUT_LIMIT','Select canonical gas variant0–6');
 const publication=await json('evidence/arkiv/2026-11-06/publish.json');
 const {report,reference}=await capture(GAS,publication.record.evidence.sha256),original=report.results[index];
 fail(report.source==='LIVE_RPC_SUBMISSION'&&original.reproduction.schema==='framefuzz.mutation-reproduction.v1','CAPTURE_CLASS','Historical gas capture required');
 const input={schema:'framefuzz.contract-input.v1',kind:'DEPLOYED',deployment:{address:original.paths[0].metadata.transaction.payer,chainId:1337},role:'PAYMASTER',provenance:{origin:'REPOSITORY_REFERENCE',reference:GAS}};
 const prepared=await prepareContractAnalysis(input,supportedContext());
 const [test]=await generateSemanticTests(prepared,{family:'verification-gas',descriptor:original.reproduction});
 const preview=await evaluateSemanticTest(test,'POLICY_PREDICTION');
 const historical=normalizedResult({...preview,classification:'HISTORICAL_LIVE',kind:'ADMISSION',
  actual:{paths:original.paths.map(p=>({path:p.id,method:p.method,admission:p.observed,receipt:p.receipt,comparison:p.comparison}))},
  provenance:{kind:'REPOSITORY_CAPTURE',references:[{...reference,caseId:original.id,capturedAt:report.generatedAt}]},confidence:'HISTORICAL_CAPTURE_VERIFIED',
  reproduction:{test,mode:'POLICY_PREDICTION'},limitations:['Historical admission/inclusion only; not current runtime or verified action-state evidence']});
 return {prepared,test,preview,historical};
}
export async function adaptOwnedExperiment(variant=1){
 fail(Number.isSafeInteger(variant)&&variant>=0&&variant<2,'INPUT_LIMIT','Select actual Sonnet experiment0 or1');
 const manifest=await json('evidence/investigator/2026-11-06/sonnet-manifest.json');
 const {report,reference}=await capture(SONNET,manifest.sha256['sonnet-retry-2.json']);
 fail(report.source==='OPENROUTER_MODEL_INVESTIGATION'&&report.status==='COMPLETE_OFFLINE_INVESTIGATION','CAPTURE_CLASS','Real saved investigator input required');
 const descriptor=report.experiments[variant].execution.descriptor,{contentDigest,...body}=descriptor;
 fail(frameDigest(body)===contentDigest,'CAPTURE_DIGEST','Investigator descriptor changed');
 const compiled=await compileOwnedFixtures();fail(compiled.inputDigest===descriptor.compilerInputDigest&&compiled.compiler===descriptor.compiler,'SOURCE_MISMATCH','Historical compiler/source profile changed');
 const input={schema:'framefuzz.contract-input.v1',kind:'SOLIDITY_SOURCE',source:{content:await readFile(new URL('../../contracts/SenderValidatorUnsafe.sol',import.meta.url),'utf8'),fileId:'OwnedInput.sol'},role:'UNKNOWN',provenance:{origin:'REPOSITORY_REFERENCE',reference:SONNET}};
 const prepared=await prepareContractAnalysis(input,supportedContext());
 const [test]=await generateSemanticTests(prepared,{family:'frame-authorization',descriptor:descriptor.mutation});
 const result=await evaluateSemanticTest(test,'OFFLINE_EXECUTED');
 fail(digest(result.actual.semanticProperties)===digest(descriptor.semanticProperties),'OBSERVATION_MISMATCH','Fresh cryptographic observations differ from saved semantic properties');
 result.provenance.references.push({...reference,descriptorDigest:contentDigest,meaning:'Historical model proposal; observations above were recomputed offline'});
 return {prepared,test,result:normalizedResult(result)};
}
export async function unsupportedContractExample(){
 const prepared=await prepareContractAnalysis({schema:'framefuzz.contract-input.v1',kind:'SOLIDITY_SOURCE',source:{fileId:'Counter.sol',content:'pragma solidity ^0.8.28; contract Counter { uint public value; function set(uint n) external { value = n; } }'}}, {schema:'framefuzz.analysis-context.v1'});
 return {prepared,result:analysisResult(prepared)};
}
