import {EVIDENCE_FACTS as facts} from './evidence-facts.js';
const gasFile=Object.keys(facts.sources).find(p=>p.includes('/mutations/'));
const uniswapFile=Object.keys(facts.sources).find(p=>p.includes('/live/'));
const labels=['Basic sponsored transaction','Unstaked Uniswap v4 pool read','Staked Uniswap v4 pool read'];
export const BRIEFING={
 generatedFrom:'canonical evidence + docs/TEST_CHECKPOINT.json',
 gasCampaign:{file:gasFile,capturedAt:facts.gas.capturedAt,sha256:facts.sources[gasFile],variants:facts.gas.variants,admissionChecks:facts.gas.decisions,
  matchedDecisions:facts.gas.matches,includedSuccess:facts.gas.included,unexpected:facts.gas.decisions-facts.gas.matches,
  components:{sender:facts.gas.components.sender,payer:facts.gas.components.payer,signature:facts.gas.components.signature,cap:facts.gas.components.cap},
  samples:facts.gas.samples},
 uniswap:{file:uniswapFile,capturedAt:facts.uniswap.capturedAt,sha256:facts.sources[uniswapFile],rows:facts.uniswap.rows.map((r,i)=>({id:r.id,label:labels[i],...Object.fromEntries(r.paths.map(p=>[p.id,{admission:p.admission,receipt:p.receipt.toUpperCase(),hash:p.hash}]))}))},
 arkiv:{gasEntity:facts.arkiv.publications[0].entityKey,uniswapEntity:facts.arkiv.publications[1].entityKey,published:facts.arkiv.publications.length,note:'Historical writes; publisher outcomes are claims, not chain execution attested by Arkiv.'},
 swarm:{contractsCompiled:true,offlineSignatureBinding:true,readOnlyPreflight:true,liveAuthorization:false,llmCalls:facts.sonnet.calls>0,
  independentLiveReproduction:false,artifact:'evidence/investigator/2026-11-06/sonnet-retry-2.json'},
 sonnet:facts.sonnet,testsAtCheckpoint:facts.testCheckpoint.passed,testCheckpoint:facts.testCheckpoint,
 disclaimer:'EIP-8141 experimental environment only. No mainnet frame support is claimed.'
};

export const SLIDES = [
  { id: 'what', title: 'What FrameFuzz is' },
  { id: 'why', title: 'Why this matters' },
  { id: 'how', title: 'How FrameFuzz works' },
  { id: 'anatomy', title: 'EIP-8141 frame anatomy' },
  { id: 'gas', title: 'Proof: gas boundary' },
  { id: 'uniswap', title: 'Proof: alternative-mempool admission' },
  { id: 'swarm', title: 'Adversarial authorization testing' },
  { id: 'oracle', title: 'Oracle trust and limits' },
  { id: 'blockers', title: 'Known blockers' },
  { id: 'faq', title: 'Tough EF questions' },
  { id: 'ask', title: 'Questions for EF' },
  { id: 'close', title: 'Technical value' },
];

export const FAQ = [
  {
    q: 'What problem does FrameFuzz solve?',
    a: 'Admission compatibility and reproducible validation testing for experimental frame transactions.',
  },
  {
    q: 'What makes it more than the workshop?',
    a: 'Deterministic semantic mutations, independently signed paths, evidence-backed rule comparison, inclusion checks and reusable regression artifacts.',
  },
  {
    q: 'Why is the alternative mempool needed?',
    a: 'The observed staked external Uniswap storage-read scenario is admitted through the alternative policy but rejected publicly.',
  },
  {
    q: 'Why is the gas boundary 67,200?',
    a: '30,000 sender verification + 67,200 payer verification + 2,800 signature cost = 100,000 in the tested implementation.',
  },
  {
    q: 'Does 14/14 mean formal correctness?',
    a: 'No — only agreement on tested cases and the observed ruleset.',
  },
  {
    q: 'Did you find an EIP-8141 vulnerability?',
    a: 'No confirmed protocol vulnerability. The owned-validator experiment targets an intentionally incomplete signature-binding fixture.',
  },
  {
    q: 'Is the AI swarm working?',
    a: `${BRIEFING.sonnet.calls} real Sonnet responses drove ${BRIEFING.sonnet.experiments} offline signature-binding experiments with ${BRIEFING.sonnet.replayed} fresh-process replays. No owned-validator EVM execution or vulnerability is proven.`,
  },
  {
    q: 'How is admission different from inclusion and action execution?',
    a: 'Returned hash versus mined receipt versus successful individual action effect. FrameFuzz reports each stage separately.',
  },
  {
    q: 'Are you testing the latest ERC-8421 specification?',
    a: 'We test the observed workshop implementation against versioned rules, not claim universal latest-draft conformance.',
  },
  {
    q: 'Does the Uniswap integration execute trades?',
    a: 'No. The demonstrated integration is a real validation-time v4 state read, not a swap.',
  },
  {
    q: 'Can it run on mainnet?',
    a: 'No. The project is confined to experimental environments; no mainnet frame support is claimed.',
  },
  {
    q: 'What happens when the devnet is down?',
    a: 'Saved evidence, offline previews, reports and regression inspection remain available.',
  },
  {
    q: 'Can an LLM fabricate a verdict?',
    a: 'No. Hypotheses are untrusted proposals; deterministic execution and independent evidence verification determine verdicts.',
  },
];
