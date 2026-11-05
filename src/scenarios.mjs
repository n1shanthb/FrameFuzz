// Rule values are supplied by an operator and pinned to a deployed sidecar.
// No reported external result is silently promoted to an executed test.
export const SCENARIOS = [
  { id: 'uniswap-v4-paymaster', label: 'Uniswap v4 paymaster · cases A–C + optional gas boundaries' },
  { id: 'verification-gas', label: 'Verification gas · below / at / above' },
];

export function validateRules(rules) {
  if (!rules || !['VERIFIED', 'MOCK'].includes(rules.status)) throw new Error('Rules require VERIFIED or MOCK status');
  for (const key of ['sidecarVersion', 'reference', 'verifiedAt']) if (typeof rules[key] !== 'string' || !rules[key].trim()) throw new Error(`Rule provenance requires ${key}`);
  return { status: rules.status, sidecarVersion: rules.sidecarVersion, reference: rules.reference, verifiedAt: rules.verifiedAt };
}

function expectation(value) {
  if (!value || !['accepted', 'rejected'].includes(value.expected)) throw new Error('Each path needs an explicit expected outcome');
  if (value.expected === 'rejected' && !(typeof value.expectedRule === 'string' && value.expectedRule.trim()) && !value.expectedErrorClass) throw new Error('Rejection expectations require a grounded rule label or error class');
  return { expected: value.expected, expectedRule: value.expectedRule ?? null, expectedErrorClass: value.expectedErrorClass ?? null };
}

export function verificationGasVariants(config) {
  const { boundary, field = 'verificationGasLimit', acceptedSide, rejectionRule } = config ?? {};
  if (!Number.isSafeInteger(boundary) || boundary < 1 || boundary >= Number.MAX_SAFE_INTEGER) throw new Error('Gas boundary must allow safe below/at/above integers');
  if (!['at-or-below', 'at-or-above'].includes(acceptedSide)) throw new Error('Specify whether this deployed rule accepts at-or-below or at-or-above');
  if (field !== 'verificationGasLimit') throw new Error('Only verificationGasLimit is supported by this family');
  if (typeof rejectionRule !== 'string' || !rejectionRule.trim()) throw new Error('Gas boundary requires an actual rejection rule label');
  return [['below', boundary - 1], ['at', boundary], ['above', boundary + 1]].map(([suffix, value]) => ({
    suffix, value, field, boundary,
    expected: (acceptedSide === 'at-or-below' ? value <= boundary : value >= boundary) ? 'accepted' : 'rejected', rejectionRule,
  }));
}

export function createScenarioCases({ scenario, adapter, rules }) {
  const provenance = validateRules(rules);
  if (!adapter) throw new Error('A signer adapter is required');
  if (adapter.mode === 'LIVE' && rules.status !== 'VERIFIED') throw new Error('LIVE adapter requires VERIFIED deployed rule provenance');
  if (!SCENARIOS.some(s => s.id === scenario)) throw new Error(`Unknown scenario ${scenario}`);
  const cases = [];
  function add({ id, description, model, setup, expectations, mutation }) {
    const c = { id, family: scenario, category: mutation ? 'Verification gas boundary' : 'Uniswap v4 sponsorship', description,
      mutation: mutation ?? null, ruleProvenance: provenance, paths: [] };
    for (const pathId of ['public', 'alt']) {
      const exp = expectation(expectations?.[pathId]);
      c.paths.push({ id: pathId, method: 'eth_sendFrameTransaction', ...exp,
        adapterMode: adapter.mode,
        prepare: ({ rpcUrl, chainId }) => adapter.build({ caseId: id, pathId, rpcUrl, chainId, model, setup }) });
    }
    cases.push(c);
  }
  if (scenario === 'uniswap-v4-paymaster') {
    for (const [id, description, poolRead, staked] of [
      ['basic', 'Case A: gas sponsor without external pool storage reads', false, false],
      ['unstaked-pool-read', 'Case B: unstaked sponsor reads real StateView pool storage', true, false],
      ['staked-pool-read', 'Case C: staked sponsor reads real StateView pool storage', true, true],
    ]) {
      const supplied = rules.paymaster?.[id];
      if (!supplied) throw new Error(`Missing paymaster rule configuration: ${id}`);
      if (poolRead && (!/^0x[\da-f]{40}$/i.test(supplied.stateView ?? '') || !/^0x[\da-f]{64}$/i.test(supplied.poolId ?? ''))) throw new Error('Pool-reading scenarios require actual StateView address and pool ID');
      add({ id: `uniswap-v4-paymaster-${id}`, description,
        model: { kind: id, poolRead, stateView: supplied.stateView ?? null, poolId: supplied.poolId ?? null },
        setup: { kind: 'paymaster', staked, poolRead, configuration: supplied.setup ?? {} }, expectations: supplied.paths });
    }
  }
  if (scenario === 'verification-gas' || rules.verificationGas) {
    for (const v of verificationGasVariants(rules.verificationGas)) {
      const exp = { expected: v.expected, expectedRule: v.expected === 'rejected' ? v.rejectionRule : null };
      add({ id: `${scenario}-gas-${v.suffix}-${v.value}`, description: `Verification gas ${v.value} around pinned boundary ${v.boundary}`,
        model: { kind: 'verification-gas', verificationGasLimit: v.value }, setup: rules.verificationGas.setup,
        expectations: { public: exp, alt: exp }, mutation: { family: 'verification-gas', field: v.field, boundary: v.boundary, value: v.value, suffix: v.suffix } });
    }
  }
  return cases;
}
