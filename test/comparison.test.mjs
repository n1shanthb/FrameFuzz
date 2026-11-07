import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSuite } from '../src/runner.mjs';
import { compareAdmission, describeRpcError } from '../src/verdict.mjs';
import { RpcResponseError } from '../src/rpc.mjs';

const hash = `0x${'a'.repeat(64)}`;
const fixture = [{ id: 'compare', paths: [
  { id: 'public', method: 'eth_sendFrameTransaction', params: ['0xcafe'], expected: 'rejected', expectedRule: 'ForeignStorage', metadata: {sender:`0x${'1'.repeat(40)}`,nonce:'0'} },
  { id: 'alt', method: 'eth_sendFrameTransaction', params: ['0xbeef'], expected: 'accepted', metadata: {sender:`0x${'2'.repeat(40)}`,nonce:'0'} },
] }];
const options = { allowChainId: 1337, submit: true, rpcUrls: { public: 'http://public.test/key', alt: 'http://alt.test/secret' }, evidenceSource: 'MOCK' };

test('separate paths use separate checked endpoints and capture independent receipt success', async () => {
  const calls = [];
  const out = await runSuite(fixture, { ...options, receiptWaitMs: 1, rpcFn: async (url, method) => {
    calls.push([url, method]);
    if (method === 'eth_chainId') return '0x539';
    if (method === 'eth_getTransactionReceipt') return { status: '0x1', blockNumber: '0x8', transactionHash: hash };
    if (url.includes('public')) throw new RpcResponseError(-32000, 'ForeignStorage');
    return hash;
  } });
  assert.equal(out.totals.matched, 1); assert.equal(out.results[0].paths[1].receipt.state, 'included_success');
  assert.deepEqual(calls.slice(0, 2).map(x => x[1]), ['eth_chainId', 'eth_chainId']);
  assert.ok(!JSON.stringify(out).includes('/secret')); assert.match(out.source, /MOCK/);
  assert.equal(out.results[0].paths[0].comparison.verdict, 'EXPECTED_REJECT');
});
test('preflight mismatch prevents ALL builders, setup and submissions', async () => {
  let built = false;
  const cases = structuredClone(fixture); cases[0].paths[0].prepare = async () => { built = true; };
  await assert.rejects(runSuite(cases, { ...options, rpcFn: async url => url.includes('alt') ? '0x1' : '0x539' }), /mainnet/);
  assert.equal(built, false);
});
test('duplicate static signed bytes and sender/nonces are blocked before any submission', async () => {
  for (const kind of ['raw', 'nonce']) {
    const cases = structuredClone(fixture);
    if (kind === 'raw') cases[0].paths[1].params = ['0xCAFE'];
    else for (const p of cases[0].paths) p.metadata = { sender: '0xabc', nonce: '0' };
    const out = await runSuite(cases, { ...options, rpcFn: async (_, method) => { assert.equal(method, 'eth_chainId'); return '0x539'; } });
    assert.equal(out.submissions, 0); assert.equal(out.totals.inconclusive, 1);
  }
});
test('preview never invokes prepare; receipt RPC errors preserve accepted admission', async () => {
  let builds = 0;
  const cases = [{ id: 'one', paths: [{ id: 'alt', method: 'eth_sendFrameTransaction', expected: 'accepted', prepare: async () => { builds++; return { raw: '0xcafe' }; } }] }];
  const rpcFn = async (_, method) => { if (method === 'eth_chainId') return '0x539'; if (method === 'eth_getTransactionReceipt') throw new Error('receipt offline'); return hash; };
  await runSuite(cases, { ...options, submit: false, rpcFn }); assert.equal(builds, 0);
  const out = await runSuite(cases, { ...options, receiptWaitMs: 1, rpcFn });
  assert.equal(out.results[0].paths[0].observed.status, 'accepted');
  assert.equal(out.results[0].paths[0].receipt.state, 'receipt_rpc_error');
  assert.equal(out.totals.matched, 1);
});
test('receipt revert and pending remain independent of matching admission', async () => {
  for (const status of ['0x0', null]) {
    const out = await runSuite([ { ...fixture[0], paths: [fixture[0].paths[1]] } ], { ...options, receiptWaitMs: 1,
      rpcFn: async (_, method) => method === 'eth_chainId' ? '0x539' : method === 'eth_getTransactionReceipt' ? status ? { status, transactionHash: hash, blockNumber: '0x1' } : null : hash });
    assert.equal(out.results[0].paths[0].receipt.state, status ? 'included_reverted' : 'not_included_before_timeout');
    assert.equal(out.totals.matched, 1);
  }
});
test('comparison distinguishes verdicts and avoids funding/nonce/malformed false positives', () => {
  assert.equal(compareAdmission('rejected', { status: 'accepted' }).verdict, 'UNEXPECTED_ACCEPT');
  assert.equal(compareAdmission('accepted', { status: 'rejected' }).verdict, 'UNEXPECTED_REJECT');
  for (const message of ['nonce too low', 'insufficient funds', 'invalid signature']) {
    const observed = describeRpcError(new RpcResponseError(-32000, message));
    assert.equal(compareAdmission('rejected', observed, 'ForeignStorage').verdict, 'INCONCLUSIVE');
  }
  const offline = describeRpcError(new Error('offline'));
  assert.equal(compareAdmission('rejected', offline).verdict, 'TRANSPORT_FAILURE');
  assert.equal(compareAdmission('rejected', { status: 'rejected', message: 'unknown' }).verdict, 'INCONCLUSIVE');
});

test('preflight transport failure produces exportable evidence and prevents all builders', async () => {
  let built = false;
  const cases = structuredClone(fixture); cases[0].paths[1].prepare = async () => { built = true; };
  const out = await runSuite(cases, { ...options, rpcFn: async url => { if (url.includes('public')) throw new Error('gateway offline'); return '0x539'; } });
  assert.equal(out.submissions, 0); assert.equal(built, false);
  assert.equal(out.results[0].paths[0].comparison.verdict, 'TRANSPORT_FAILURE');
  assert.equal(out.results[0].paths[1].comparison.verdict, 'INCONCLUSIVE');
});

test('comparative raw fixtures without nonce metadata are not submitted', async () => {
  const cases = structuredClone(fixture); for (const p of cases[0].paths) delete p.metadata;
  const out = await runSuite(cases, { ...options, rpcFn: async (_, method) => { assert.equal(method, 'eth_chainId'); return '0x539'; } });
  assert.equal(out.submissions, 0); assert.match(out.results[0].paths[0].observed.message, /metadata/);
});
test('MOCK adapters and MOCK replay metadata cannot target remote gateways', async () => {
  for (const metadataOnly of [false, true]) {
    const cases = structuredClone(fixture);
    if (metadataOnly) cases[0].paths[0].metadata.mode = 'MOCK'; else cases[0].paths[0].adapterMode = 'MOCK';
    await assert.rejects(runSuite(cases, options), /loopback/);
  }
});
test('mismatched receipt cannot claim inclusion or erase the admission verdict', async () => {
  const out = await runSuite([{ ...fixture[0], paths: [fixture[0].paths[1]] }], { ...options, receiptWaitMs: 1,
    rpcFn: async (_, method) => method === 'eth_chainId' ? '0x539' : method === 'eth_getTransactionReceipt' ? { status: '0x1', blockNumber: '0x1', transactionHash: `0x${'b'.repeat(64)}` } : hash });
  assert.equal(out.results[0].paths[0].receipt.state, 'receipt_rpc_error'); assert.equal(out.totals.matched, 1);
});
