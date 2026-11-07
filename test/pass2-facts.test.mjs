import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {briefingFacts} from '../src/briefing-facts.mjs';
import {EVIDENCE_FACTS} from '../web/js/evidence-facts.js';
import {BRIEFING,FAQ} from '../web/js/briefing.js';
test('displayed facts derive from canonical captures, publication receipts and explicit test checkpoint',async()=>{
  const facts=await briefingFacts();assert.deepEqual(EVIDENCE_FACTS,facts);
  assert.deepEqual([BRIEFING.gasCampaign.variants,BRIEFING.gasCampaign.admissionChecks,BRIEFING.gasCampaign.includedSuccess],[7,14,8]);
  assert.equal(BRIEFING.arkiv.published,2);assert.deepEqual([BRIEFING.sonnet.calls,BRIEFING.sonnet.experiments,BRIEFING.sonnet.replayed],[4,2,2]);
  assert.equal(BRIEFING.testsAtCheckpoint,facts.testCheckpoint.passed);assert.equal(BRIEFING.swarm.liveAuthorization,false);
  assert.equal(BRIEFING.uniswap.rows[2].alt.admission,'accepted');assert.equal(BRIEFING.uniswap.rows[2].public.admission,'rejected');
  assert.ok(!FAQ.some(f=>/no real LLM calls/.test(f.a)));
});
test('presentation keeps proof boundaries and omits stale proposed mutation',async()=>{
  const source=await readFile(new URL('../web/js/app.js',import.meta.url),'utf8');
  assert.ok(!source.includes('record(2,999)'));assert.match(source,/No unauthorized action proven/);assert.match(source,/not EVM execution/);
});
