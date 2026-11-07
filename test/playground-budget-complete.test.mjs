import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import {analyzeContract} from '../src/playground/compile.mjs';
import {investigateContract,isRepairableRejection,INVESTIGATION_LIMITS} from '../src/playground/investigate.mjs';
import {budgetStatus,planInvestigationBudget,SPRINT_ID,SPRINT_BUDGET_USD} from '../src/playground/budget.mjs';
import {describeBudgetGate,OpenRouterProvider,DEFAULT_LIMITS} from '../src/swarm/provider.mjs';
import {byocTestProvider} from '../scripts/test-support/byoc.mjs';
import {readFileSync} from 'node:fs';

const QUOTA=readFileSync(new URL('../examples/contracts/QuotaVault.sol',import.meta.url),'utf8');

test('exact QuotaVault failure gate was maxInputBytes, not sprint USD',()=>{
  const gate=describeBudgetGate({maxCalls:8,maxTotalTokens:60000,maxCostUSD:0.55,maxInputBytes:24000},{calls:5,tokens:27120,costUSD:0.1150578,bytes:24749,reserveTokens:27749,reserveCost:0.178745});
  assert.match(gate,/input too large/);
  assert.match(gate,/24749/);
  assert.match(gate,/24000/);
  assert.equal(describeBudgetGate(DEFAULT_LIMITS,{calls:5,tokens:27120,costUSD:0.115,bytes:24749,reserveTokens:10000,reserveCost:0.05}),null);
});

test('identical original/mutated proposals are not repairable',()=>{
  assert.equal(isRepairableRejection({feasibility:{effective:'INVALID',deterministic:{reason:'CHANGE: Original and mutation must differ'}}}),false);
  assert.equal(isRepairableRejection({feasibility:{effective:'INVALID',deterministic:{reason:'FUNCTION: Target must exist'},model:{repairRequired:true}}}),true);
});

test('mock investigation reaches COMPLETE with local ABI execution and Critic after unrepairable reject',async()=>{
  const analysis=await analyzeContract({source:QUOTA,role:'UNKNOWN',contractName:'QuotaVault'});
  assert.equal(analysis.status,'READY');
  assert.ok(analysis.functions.some(f=>f.signature==='deposit(uint8)'));
  assert.ok(analysis.functions.some(f=>f.signature==='withdraw(uint256)'));
  let mutationCount=0;
  const provider=byocTestProvider({forceRepair:false,followUp:false});
  const original=provider.fetchImpl;
  provider.fetchImpl=async(url,request)=>{
    const body=JSON.parse(request.body);
    const role=body.response_format.json_schema.name.replace('byoc_','');
    if(role==='mutation'){
      mutationCount++;
      const facts=body.messages.map(m=>{try{return JSON.parse(m.content).untrustedMessage;}catch{return null;}}).find(m=>m?.type==='VERIFIED_COMPILER_FACTS').payload;
      const deposit=facts.functions.find(f=>f.signature==='deposit(uint8)');
      const withdraw=facts.functions.find(f=>f.signature==='withdraw(uint256)');
      const factId=facts.sourceFacts.find(f=>f.kind==='function')?.id??facts.sourceFacts[0].id;
      const output={
        summary:'Mock mixed batch: one READY ABI boundary and one identical-args reject',
        questions:[],
        toolRequests:[],
        proposals:[
          {id:'prop-001',analysisId:facts.analysisId,sourceDigest:facts.sourceDigest,functionSignature:deposit.signature,originalArgs:['1'],mutatedArgs:['255'],tool:'abi_encode',domain:'ABI_ENCODING',expectedVerdict:'ACCEPT',negativeObjective:'NONE',preconditions:[],factIds:[factId],hypothesis:'uint8 max boundary',evidenceNeeded:'ABI encoding only'},
          {id:'prop-002',analysisId:facts.analysisId,sourceDigest:facts.sourceDigest,functionSignature:withdraw.signature,originalArgs:['1'],mutatedArgs:['1'],tool:'structure_check',domain:'SOURCE_STRUCTURE',expectedVerdict:'ACCEPT',negativeObjective:'NONE',preconditions:[],factIds:[factId],hypothesis:'identical args must be filtered',evidenceNeeded:'structure only'},
        ],
      };
      return new Response(JSON.stringify({id:'mock-mixed',model:'MOCK',usage:{total_tokens:200,cost:0.001},choices:[{finish_reason:'stop',message:{content:JSON.stringify(output)}}]}));
    }
    return original(url,request);
  };
  const report=await investigateContract(analysis,{
    provider,
    authorizeProvider:true,
    arkivDiscovery:{schema:'framefuzz.arkiv-discovery.v1',status:'NO_APPLICABLE_QUERY',cases:[],agentSummaries:[],notice:'No EIP-8141 signals',broadcasts:0,source:'n/a'},
  });
  assert.equal(report.status,'COMPLETE',report.error);
  assert.ok(report.critic?.assessment);
  assert.equal(report.agents.critic.calls>=1,true);
  assert.equal(report.broadcasts,0);
  assert.equal(report.evmExecuted,false);
  const ready=report.workspace.proposals.find(e=>e.proposal.id==='prop-001');
  const bad=report.workspace.proposals.find(e=>e.proposal.id==='prop-002');
  assert.equal(ready.state,'EXECUTED');
  assert.ok(ready.execution?.actual?.mutatedCalldata);
  assert.equal(bad.state,'REJECTED');
  assert.match(bad.feasibility.deterministic.reason,/must differ/i);
  assert.equal(mutationCount,1,'identical reject must not burn a repair model call');
  const agentCalls=Object.values(report.agents).reduce((n,a)=>n+a.calls,0);
  assert.equal(agentCalls,report.provider.calls,'agent call counters reconcile with provider transport calls');
});

test('sprint ledger imports prior same-sprint spend under repo runs/ and plans per-run allocation',async()=>{
  const dir=await mkdtemp(path.join(path.resolve('runs'),'ff-budget-'));
  try{
    const status=await budgetStatus(dir);
    assert.equal(status.sprintId,SPRINT_ID);
    assert.ok(status.spentUSD>=0.62,'prior evidence sprint spend must be imported');
    assert.ok(status.entries.some(e=>e.type==='PRIOR_IMPORT'));
    assert.ok(status.remainingUSD<=SPRINT_BUDGET_USD-0.62+1e-9);
    const plan=planInvestigationBudget({profileId:'byoc',remainingUSD:status.remainingUSD});
    assert.ok(plan.allocatedUSD<=status.remainingUSD+1e-12);
    assert.ok(plan.estimatedFinishUSD<=INVESTIGATION_LIMITS.estimatedFinishUSD+0.01);
  }finally{
    const {rm}=await import('node:fs/promises');
    await rm(dir,{recursive:true,force:true});
  }
});

test('provider input-limit errors stay distinct from sprint exhaustion',async()=>{
  const p=new OpenRouterProvider({env:{OPENROUTER_API_KEY:'k'},testTransport:true,limits:{maxCalls:10,maxInputBytes:100,maxCostUSD:0.5},fetchImpl:async()=>assert.fail('must not send')});
  await assert.rejects(()=>p.structured([{role:'user',content:'x'.repeat(200)}],{name:'t',schema:{type:'object',properties:{},additionalProperties:false},validate:x=>x}),/input too large/);
});
