import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScenarioCases, verificationGasVariants } from '../src/scenarios.mjs';
import { createAdapter } from '../src/adapters/index.mjs';
import { runSuite } from '../src/runner.mjs';
import { RpcResponseError } from '../src/rpc.mjs';

const rules = { status: 'MOCK', sidecarVersion: 'mock-only-1', reference: 'test model, not deployed policy', verifiedAt: '2026-11-06',
  verificationGas: { boundary: 100, acceptedSide: 'at-or-below', rejectionRule: 'MockVerificationGasLimit' } };
test('gas variants cover below/at/above without mutating signed bytes or assuming direction', () => {
  assert.deepEqual(verificationGasVariants(rules.verificationGas).map(v => [v.value, v.expected]), [[99, 'accepted'], [100, 'accepted'], [101, 'rejected']]);
  assert.deepEqual(verificationGasVariants({ ...rules.verificationGas, acceptedSide: 'at-or-above' }).map(v => v.expected), ['rejected', 'accepted', 'accepted']);
  assert.throws(() => verificationGasVariants({ ...rules.verificationGas, boundary: Number.MAX_SAFE_INTEGER }), /safe/);
  assert.throws(() => createScenarioCases({ scenario: 'verification-gas', adapter: { mode: 'LIVE' }, rules }), /VERIFIED/);
});
test('mock gas suite re-signs all six independent path variants and compares rule evidence', async () => {
  let account = 0; const models = [];
  const adapter = createAdapter({ id: 'unit-test', mode: 'MOCK', accountFor: async () => ({ sender: `0x${(++account).toString(16).padStart(40, '0')}` }), getNonce: async () => 0,
    sign: async ({ model }) => { models.push(model); return { raw: `0x${model.verificationGasLimit.toString(16).padStart(2, '0')}${account.toString(16).padStart(2, '0')}` }; } });
  const cases = createScenarioCases({ scenario: 'verification-gas', adapter, rules });
  const out = await runSuite(cases, { rpcUrls: { public: 'http://127.0.0.1:1001', alt: 'http://127.0.0.1:1002' }, allowChainId: 1337, submit: true,
    rpcFn: async (_, method, params) => {
      if (method === 'eth_chainId') return '0x539';
      if (params[0].startsWith('0x65')) throw new RpcResponseError(-32000, 'MockVerificationGasLimit');
      return `0x${'a'.repeat(64)}`;
    } });
  assert.equal(out.totals.matched, 3); assert.equal(out.submissions, 6); assert.match(out.source, /MOCK/);
  assert.deepEqual(models.map(m => m.verificationGasLimit), [99, 99, 100, 100, 101, 101]);
});
test('paymaster cases require supplied path rules and real-shaped pool configuration', () => {
  const accept = { expected: 'accepted' }, reject = { expected: 'rejected', expectedRule: 'ForeignStorage' };
  const pool = { stateView: `0x${'1'.repeat(40)}`, poolId: `0x${'2'.repeat(64)}` };
  const paymaster = { basic: { paths: { public: accept, alt: accept } },
    'unstaked-pool-read': { ...pool, paths: { public: reject, alt: reject } }, 'staked-pool-read': { ...pool, paths: { public: reject, alt: accept } } };
  const adapter = { mode: 'MOCK', build: () => {} };
  const cases = createScenarioCases({ scenario: 'uniswap-v4-paymaster', adapter, rules: { ...rules, paymaster, verificationGas: undefined } });
  assert.equal(cases.length, 3); assert.equal(cases[2].paths[1].expected, 'accepted');
  assert.throws(() => createScenarioCases({ scenario: 'uniswap-v4-paymaster', adapter, rules: { ...rules, paymaster: {} } }), /Missing paymaster/);
});
