import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter } from '../src/adapters/index.mjs';

const sender = n => `0x${n.toString(16).padStart(40, '0')}`;
function plugin(extra = {}) {
  let i = 0;
  return { id: 'test-only', mode: 'MOCK', accountFor: async () => ({ sender: sender(++i), privateKey: 'do-not-export' }),
    getNonce: async () => 4n, sign: async ({ nonce, sender: address }) => ({ raw: `0x${address.slice(2)}${Number(nonce).toString(16).padStart(2, '0')}`, privateKey: 'do-not-export' }), ...extra };
}
const ctx = { caseId: 'baseline', pathId: 'public', rpcUrl: 'http://localhost', chainId: 1337, model: { gas: 100 } };

test('adapter builds independent signed variants and exports allowlisted replay metadata', async () => {
  const adapter = createAdapter(plugin());
  const a = await adapter.build(ctx), b = await adapter.build({ ...ctx, pathId: 'alt', model: { gas: 101 } });
  assert.notEqual(a.raw, b.raw); assert.notEqual(a.metadata.sender, b.metadata.sender);
  assert.equal(a.metadata.nonce, '4'); assert.ok(!JSON.stringify(a).includes('do-not-export'));
});
test('adapter executes setup before querying pending nonce and signing', async () => {
  const calls = [];
  const adapter = createAdapter(plugin({ setup: async () => calls.push('setup'), getNonce: async ({ blockTag }) => { calls.push(blockTag); return 5; },
    sign: async ({ nonce }) => { calls.push(nonce); return { raw: '0xcafe' }; } }));
  await adapter.build({ ...ctx, setup: { stake: true } }); assert.deepEqual(calls, ['setup', 'pending', '5']);
});
test('adapter fails closed on setup errors, unsafe sender reuse, invalid bytes, and missing hooks', async () => {
  const bad = createAdapter(plugin({ setup: async () => { throw new Error('stake failed'); } }));
  await assert.rejects(bad.build({ ...ctx, setup: {} }), /stake failed/);
  await assert.rejects(bad.build(ctx), /session failed/);
  const reused = createAdapter(plugin({ accountFor: async () => ({ sender: sender(1) }) }));
  await reused.build(ctx); await assert.rejects(reused.build(ctx), /sender reuse/);
  await assert.rejects(createAdapter(plugin({ sign: async () => ({ raw: 'placeholder' }) })).build(ctx), /signed transaction/);
  assert.throws(() => createAdapter({}), /accountFor/);
});
test('adapter rejects mainnet before calling any setup or signer', async () => {
  const adapter = createAdapter(plugin({ accountFor: async () => { throw new Error('must not call'); } }));
  await assert.rejects(adapter.build({ ...ctx, chainId: 1 }), /non-mainnet/);
});
