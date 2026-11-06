import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDiscoveryContext,
  scoreCaseRelevance,
  discoverCommunityRegressions,
  sanitizeArkivCase,
  findOverlappingArkivCases,
  buildPublishConfirmation,
  arkivToolOutput,
} from '../src/playground/arkiv-intelligence.mjs';
import {loadUniswapProfileAnalysis} from '../src/playground/profiles.mjs';
import {analyzeContract} from '../src/playground/compile.mjs';
import {investigateContract} from '../src/playground/investigate.mjs';
import {CONTRACT_A,byocTestProvider} from '../scripts/test-support/byoc.mjs';
import {savedCommunity} from '../src/arkiv/saved.mjs';

const mockCase=(overrides={})=>({
  key:'0x'+'ab'.repeat(32),
  owner:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',
  creator:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',
  expiresAtBlock:'345303',
  provenance:'FRESH_ARKIV_READ',
  verification:{schema:'VALID',digest:'VALID',creatorBinding:'VALID',expiry:'ACTIVE',replayAllowed:true},
  record:{
    publisher:'0x20370BE5BA867Ab4779ad0686963A55ADc0722b1',
    contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
    suite:'verification-gas',
    mutationFamily:'verification-gas',
    ruleId:'MAX_VERIFY_GAS',
    implementationVersion:'forshtat-1337-observed-2026-11-06.v1',
    semanticParameters:{field:'verificationGasLimit',value:67198},
    originalOutcomes:{public:{expected:'accepted',admission:'accepted',verdict:'EXPECTED_ACCEPT',confidence:'VERIFIED'},alt:{expected:'accepted',admission:'accepted',verdict:'EXPECTED_ACCEPT',confidence:'VERIFIED'}},
    reproduction:{definitionDigest:'abc'},
    ...overrides.record,
  },
  ...overrides,
});

test('generic BYOC contracts do not inherit unrelated gas-admission fixtures',async()=>{
  const a=await analyzeContract({source:CONTRACT_A});
  const ctx=buildDiscoveryContext(a);
  assert.equal(ctx.queries.length,0);
  assert.match(ctx.notice,/No EIP-8141/);
  const discovery=await discoverCommunityRegressions(a,{
    registryFactory:()=>({query:async()=>{throw new Error('must not query');}}),
  });
  assert.equal(discovery.status,'NO_APPLICABLE_QUERY');
  assert.equal(discovery.cases.length,0);
});

test('Uniswap profile discovers storage and verification-gas families with relevance',async()=>{
  const analysis=await loadUniswapProfileAnalysis();
  const ctx=buildDiscoveryContext(analysis);
  assert.ok(ctx.queries.some(q=>q.suite==='uniswap-storage'));
  assert.ok(ctx.hasStateView);
  const gas=mockCase();
  const storage=mockCase({record:{...gas.record,suite:'uniswap-storage',ruleId:'STORAGE_ACCESS',mutationFamily:'uniswap-storage',uniswap:{protocol:'uniswap-v4',poolId:'0x1',contracts:{stateView:{address:'0x2'}},paymaster:{address:'0x3',stake:{staked:true}}}}});
  const unrelated=mockCase({record:{...gas.record,suite:'verification-gas',ruleId:'OTHER_RULE'}});
  assert.ok(scoreCaseRelevance(ctx,storage).score>0);
  assert.ok(scoreCaseRelevance(ctx,gas).score>0);
  assert.equal(scoreCaseRelevance(ctx,unrelated).score,0);
});

test('tampered verification and expired/non-replay rows are excluded from agent summaries',async()=>{
  const analysis=await loadUniswapProfileAnalysis();
  const good=mockCase();
  const badDigest=mockCase({verification:{schema:'VALID',digest:'INVALID',creatorBinding:'VALID',expiry:'ACTIVE',replayAllowed:false}});
  const discovery=await discoverCommunityRegressions(analysis,{
    registryFactory:()=>({query:async()=>({cases:[good,badDigest],rejected:[]})}),
  });
  assert.equal(discovery.status,'AVAILABLE');
  assert.equal(discovery.cases.length,1);
  assert.equal(discovery.cases[0].contentDigest,good.record.contentDigest);
  const tool=arkivToolOutput(discovery);
  assert.equal(tool.untrusted,true);
  assert.equal(tool.broadcasts,0);
  assert.match(tool.cases[0].historicalOutcomes.public.label,/HISTORICAL/);
});

test('Arkiv outage soft-fails into saved fallback or unavailable without breaking investigation',async()=>{
  const a=await analyzeContract({source:CONTRACT_A});
  // Force a paymaster-like context so queries are attempted, then fail live.
  const analysis={...a,declaredRole:'PAYMASTER',detectedRole:{role:'PAYMASTER',basis:'test'},source:a.source+'\n// StateView.getSlot0 paymaster verificationGasLimit'};
  const discovery=await discoverCommunityRegressions(analysis,{
    registryFactory:()=>({query:async()=>{throw new Error('network down');}}),
    savedLookup:savedCommunity,
    timeoutMs:200,
  });
  assert.ok(['AVAILABLE','EMPTY','UNAVAILABLE'].includes(discovery.status));
  assert.equal(discovery.broadcasts,0);
  if(discovery.status==='AVAILABLE')assert.ok(discovery.source==='SAVED_FALLBACK');

  const report=await investigateContract(a,{
    provider:byocTestProvider({forceRepair:false}),
    authorizeProvider:true,
    arkivDiscovery:{status:'UNAVAILABLE',cases:[],agentSummaries:[],notice:'Community regression lookup unavailable.',broadcasts:0,source:'NONE'},
  });
  assert.equal(report.status,'COMPLETE',report.error);
  assert.equal(report.arkivIntelligence.discovery.status,'UNAVAILABLE');
  assert.ok(report.workspace.messages.some(m=>m.type==='COMMUNITY_REGRESSION_INTELLIGENCE'));
});

test('investigation with matching Arkiv summaries records consultation and overlap metadata',async()=>{
  const analysis=await analyzeContract({source:CONTRACT_A});
  const row=mockCase();
  const discovery={
    status:'AVAILABLE',source:'MOCK',broadcasts:0,notice:'mock matches',
    cases:[sanitizeArkivCase(row,{score:50,reasons:['test match']})],
    agentSummaries:[{entityKey:row.key,suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',contentDigest:row.record.contentDigest,publisher:row.record.publisher,expiresAtBlock:row.expiresAtBlock,replayAllowed:true,relevanceReasons:['test match'],historicalOutcomes:{},notice:'untrusted'}],
  };
  const overlaps=findOverlappingArkivCases({
    domain:'POLICY_PREDICTION',tool:'historical_evidence',hypothesis:'verify gas boundary',mutatedArgs:['67198'],
  },discovery);
  assert.ok(overlaps.length>=1);

  const report=await investigateContract(analysis,{
    provider:byocTestProvider({forceRepair:false,followUp:false}),
    authorizeProvider:true,
    arkivDiscovery:discovery,
  });
  assert.equal(report.status,'COMPLETE',report.error);
  assert.ok(report.arkivIntelligence.consulted.length>=1);
  assert.ok(report.arkivIntelligence.influences.some(i=>i.action==='INJECT_SUMMARIES'));
  assert.ok(report.workspace.toolOutputs.some(t=>t.tool==='arkiv_regressions'));
  assert.ok(report.workspace.messages.some(m=>m.type==='COMMUNITY_REGRESSION_INTELLIGENCE'));
});

test('operator publish confirmation binds intent; public cannot spend wallet; fee ceiling holds',()=>{
  const live={gasPriceWei:'1014938300',nonce:0,balanceWei:'10000000000000000000',currentBlock:'302273'};
  const publicView=buildPublishConfirmation({
    contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
    sourceReport:'evidence/mutations/x.json',suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',expiresAtBlock:'345303',
    maxFeeEther:'0.001',env:{},live,
  });
  assert.equal(publicView.canPublish,false);
  assert.equal(publicView.operatorRequired,true);

  const key='0x'+'11'.repeat(32);
  const ok=buildPublishConfirmation({
    contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
    sourceReport:'evidence/mutations/x.json',suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',expiresAtBlock:'345303',
    maxFeeEther:'0.001',env:{ARKIV_PRIVATE_KEY:key},live,
  });
  assert.equal(ok.operatorRequired,false);
  assert.equal(ok.canPublish,true);
  assert.match(ok.intent.intentDigest,/^[\da-f]{64}$/);
  assert.equal(ok.envelope.maxFeeEther,'0.001');

  const tight=buildPublishConfirmation({
    contentDigest:'0f7f014559fbfb6ea828820cc954401f1562937b66c2fe24360959dcb5196b25',
    sourceReport:'evidence/mutations/x.json',suite:'verification-gas',ruleId:'MAX_VERIFY_GAS',expiresAtBlock:'345303',
    maxFeeEther:'0.000628854',env:{ARKIV_PRIVATE_KEY:key},live,
  });
  assert.equal(tight.canPublish,false);
  assert.ok(tight.gate.blockers.includes('feeWithinCeiling'));
});
