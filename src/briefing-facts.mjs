import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const FACT_SOURCES={
  gas:'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
  uniswap:'evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json',
  sonnet:'evidence/investigator/2026-11-06/sonnet-retry-2.json',
  publications:['evidence/arkiv/2026-11-06/publish.json','evidence/integrated/2026-11-06/arkiv-publish.json'],
};
export async function briefingFacts(){
  const sources={};
  const load=async file=>{const bytes=await readFile(new URL('../'+file,import.meta.url));sources[file]=createHash('sha256').update(bytes).digest('hex');return JSON.parse(bytes);};
  const gas=await load(FACT_SOURCES.gas),uniswap=await load(FACT_SOURCES.uniswap),sonnet=await load(FACT_SOURCES.sonnet);
  const publications=await Promise.all(FACT_SOURCES.publications.map(load));
  if(gas.source!=='LIVE_RPC_SUBMISSION'||uniswap.source!=='LIVE_RPC_SUBMISSION'||sonnet.source!=='OPENROUTER_MODEL_INVESTIGATION'||publications.some(p=>p.receipt.status!=='success'||p.receipt.transactionHash!==p.transactionHash))throw new Error('Briefing requires genuine classified evidence and publication receipts');
  const testCheckpoint=JSON.parse(await readFile(new URL('../docs/TEST_CHECKPOINT.json',import.meta.url),'utf8'));
  if(testCheckpoint.schema!=='framefuzz.test-checkpoint.v1'||!Number.isSafeInteger(testCheckpoint.passed)||testCheckpoint.passed<1||testCheckpoint.failed!==0||testCheckpoint.skipped!==0)throw new Error('Invalid passing-suite checkpoint');
  const paths=gas.results.flatMap(c=>c.paths),at=gas.results.find(c=>c.mutation.parameter.region==='at').paths[0].oracle.components;
  return {schema:'framefuzz.briefing-facts.v1',classification:'HISTORICAL_EVIDENCE_DERIVED',sources:Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b))),
    gas:{capturedAt:gas.generatedAt,variants:gas.results.length,decisions:paths.length,matches:paths.filter(p=>p.comparison.verdict.startsWith('EXPECTED_')).length,
      included:paths.filter(p=>p.receipt?.state==='included_success').length,components:at,
      samples:[at.payer-1,at.payer,at.payer+1].map(value=>{const c=gas.results.find(c=>c.mutation.parameter.value===value);if(!c)throw new Error('Missing evidenced boundary sample');return {value,region:c.mutation.parameter.region,outcome:c.paths.find(p=>p.id==='public').observed.status};})},
    uniswap:{capturedAt:uniswap.generatedAt,stateViewRead:'VALIDATION_TIME_GET_SLOT0',rows:['basic-baseline-50000','unstaked-baseline-50000','staked-baseline-50000'].map(id=>{
      const c=uniswap.results.find(x=>x.id===id);if(!c)throw new Error('Missing canonical baseline');
      return {id,paths:c.paths.map(p=>({id:p.id,admission:p.observed.status,receipt:p.receipt.state,hash:p.observed.hash??null}))};
    })},
    arkiv:{publications:publications.map(p=>({entityKey:p.entityKey,hash:p.transactionHash,block:String(p.receipt.blockNumber),publisher:p.publisher})),currentAvailability:'NOT_CHECKED'},
    sonnet:{calls:sonnet.realLLMCalls,experiments:sonnet.experiments.length,replayed:sonnet.experiments.filter(e=>e.independentReplay?.equivalentSemanticProperties).length,
      executionClass:sonnet.executionClass,liveValidatorExecution:false},
    testCheckpoint};
}
