/** Verified facts sourced from committed evidence and docs/LIVE_EVIDENCE.md.
 *  Do not invent values here. Omit anything not independently established. */
export const BRIEFING = {
  generatedFrom: 'docs/LIVE_EVIDENCE.md + evidence/mutations + evidence/live + evidence/swarm',
  gasCampaign: {
    file: 'evidence/mutations/2026-11-06/2026-11-05T22-41-59-129Z-LIVE_RPC_SUBMISSION-947a7e01.json',
    capturedAt: '2026-11-05T22:40:15.811Z',
    sha256: 'de690539fac4b65b5047141d592bd8cef44ef3991a030d6912c730ae08ee2972',
    variants: 7,
    admissionChecks: 14,
    matchedDecisions: 14,
    includedSuccess: 8,
    unexpected: 0,
    components: { sender: 30000, payer: 67200, signature: 2800, cap: 100000 },
    samples: [
      { value: 67199, region: 'below', outcome: 'accepted' },
      { value: 67200, region: 'at', outcome: 'accepted' },
      { value: 67201, region: 'above', outcome: 'rejected' },
    ],
  },
  uniswap: {
    file: 'evidence/live/2026-11-06/2026-11-05T22-04-27-896Z-LIVE_RPC_SUBMISSION-3a838bca.json',
    capturedAt: '2026-11-05T22:04:27.052Z',
    sha256: 'c473950c4697551408e406a2f32cdd4738c22c3a26bc0044a4d5ee8d0c0468a6',
    rows: [
      {
        id: 'basic-baseline-50000',
        label: 'Basic sponsored transaction',
        public: { admission: 'accepted', receipt: 'INCLUDED_SUCCESS' },
        alt: { admission: 'accepted', receipt: 'INCLUDED_SUCCESS' },
      },
      {
        id: 'unstaked-baseline-50000',
        label: 'Unstaked Uniswap v4 pool read',
        public: { admission: 'rejected', receipt: 'NOT_CHECKED' },
        alt: { admission: 'rejected', receipt: 'NOT_CHECKED' },
      },
      {
        id: 'staked-baseline-50000',
        label: 'Staked Uniswap v4 pool read',
        public: { admission: 'rejected', receipt: 'NOT_CHECKED' },
        alt: { admission: 'accepted', receipt: 'INCLUDED_SUCCESS', hash: '0xbb9143eb2964bdc4de9d59f15404baf14f59465f0ac0f5d5903dfa0173741b6c' },
      },
    ],
  },
  arkiv: {
    gasEntity: '0x5393e97dda9fec992ad4e792127064fcd17efb30572368a7ea1abbe7326db2e1',
    uniswapEntity: '0x6779cf38a4398eb90da94b11885e691b84a6bb09dda59974cf5b8f1a21db773e',
    note: 'Publisher-claimed LIVE evidence is not independently attested by Arkiv.',
  },
  swarm: {
    contractsCompiled: true,
    offlineSignatureBinding: true,
    readOnlyPreflight: true,
    liveAuthorization: false,
    llmCalls: false,
    independentLiveReproduction: false,
    artifact: 'evidence/swarm/milestone-1/offline.json',
  },
  testsAtCheckpoint: 83,
  disclaimer: 'EIP-8141 experimental environment only. No mainnet frame support is claimed.',
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
    a: 'Offline tooling exists; no real LLM calls at the latest checkpoint. Do not advertise autonomous investigation until real calls are recorded.',
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
