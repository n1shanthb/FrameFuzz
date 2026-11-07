import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {analyzeContract} from '../src/playground/compile.mjs';
import {checkProposal,executeProposal} from '../src/playground/tools.mjs';
import {loadUniswapProfileAnalysis} from '../src/playground/profiles.mjs';
import {budgetStatus,reserveBudget,settleBudget,attachSprintBudget} from '../src/playground/budget.mjs';
import {CONTRACT_A,byocProposal} from '../scripts/test-support/byoc.mjs';
import {agentFacts} from '../src/playground/investigate.mjs';
import {OpenRouterProvider} from '../src/swarm/provider.mjs';
test('uint8 256 is SKIPPED_INVALID unless explicit ABI_TOOL_TEST',async()=>{
 const a=await analyzeContract({source:CONTRACT_A}),facts=agentFacts(a),base=byocProposal(facts);
 const accidental={...base,mutatedArgs:['256'],expectedVerdict:'REJECT',negativeObjective:'ABI_REJECTION',domain:'ABI_ENCODING'};
 assert.equal(checkProposal(accidental,a).decision,'INVALID');
 const tool={...accidental,domain:'ABI_TOOL_TEST'};
 assert.equal(checkProposal(tool,a).decision,'EXECUTABLE');
 const out=executeProposal(tool,a);
 assert.equal(out.outcome.classification,'XFAIL');
 assert.equal(out.outcome.outcomeDomain,'ABI_TOOL_TEST');
 assert.equal(out.actual.error,'ABI_INTEGER_RANGE');
 assert.match(out.actual.meaning,/encoder conformance|ABI encoder/i);
 assert.equal(out.outcome.evmExecuted,false);
 assert.equal(executeProposal(byocProposal(facts),a).outcome.classification,'PASS');
});
test('Uniswap profile loads StateView context and captured evidence while fresh admission stays gated',async()=>{
 const a=await loadUniswapProfileAnalysis();
 assert.equal(a.status,'READY');assert.equal(a.profile.id,'uniswap-v4-paymaster');
 assert.equal(a.profile.uniswapContext.interaction,'StateView.getSlot0(bytes32)');
 assert.match(a.source,/getSlot0/);
 assert.equal(a.profile.historicalEvidence.classification,'CAPTURED_LIVE_EVIDENCE');
 assert.equal(a.profile.historicalEvidence.flagship.transactionIdentity,'0x72a82645d0f0d5d1ed2d537976b3580ab92b65720cd07a61e76200a2cc96b067');
 assert.equal(a.profile.historicalEvidence.flagship.alternative.admissionId,2065);
 assert.ok(a.capabilities.includes('CAPTURED_LIVE_EVIDENCE'));
 assert.ok(a.capabilities.includes('LIVE_UNISWAP_ADMISSION_PREPARE'));
 assert.ok(!a.capabilities.includes('FRESH_ADMISSION'));
});
test('sprint budget ledger reserves, settles and blocks overspend across restarts',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'ff-budget-'));
 try{
  await reserveBudget(dir,'byoc-test',0.55);
  let st=await budgetStatus(dir);assert.ok(st.remainingUSD<0.46);
  st=await settleBudget(dir,'byoc-test',{reservedUSD:0.55,actualUSD:0.12});
  assert.equal(st.spentUSD,0.12);assert.ok(st.remainingUSD>0.8);
  await reserveBudget(dir,'almost-all',0.85);await settleBudget(dir,'almost-all',{reservedUSD:0.85,actualUSD:0.85});
  await assert.rejects(reserveBudget(dir,'too-big',0.2),/SPRINT_BUDGET_EXHAUSTED|need/);
  const provider=attachSprintBudget(new OpenRouterProvider({env:{OPENROUTER_API_KEY:'k'},testTransport:true,limits:{maxCalls:2,maxCostUSD:0.05},fetchImpl:async()=>new Response(JSON.stringify({id:'g1',model:'m',usage:{total_tokens:10,cost:0.01},choices:[{finish_reason:'stop',message:{content:'{}'}}]}))}),dir,'mock-run',{maxUSD:0.03});
  const before=await budgetStatus(dir);await provider.settleSprint({failed:false});const after=await budgetStatus(dir);assert.equal(after.spentUSD,before.spentUSD);
 }finally{await rm(dir,{recursive:true,force:true});}
});
