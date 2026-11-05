import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numericBoundaryCases } from '../src/mutations.mjs';

test('numeric boundary generator constructs three separately signed variants', async () => {
  const encoded = [];
  const fixtures = await numericBoundaryCases({
    id: 'limit', template: { verificationGas: 100, other: 1 }, field: 'verificationGas', boundary: 100,
    sign: async model => { encoded.push(model.verificationGas); return `0x${model.verificationGas.toString(16)}`; },
    expectedFor: async model => model.verificationGas <= 100 ? 'accepted' : 'rejected',
  });
  assert.deepEqual(encoded, [99,100,101]);
  assert.deepEqual(fixtures.map(c => c.paths[0].expected), ['accepted','accepted','rejected']);
  assert.equal(fixtures[2].mutation.value, 101);
});
test('mutator rejects missing signer rather than corrupting signed payload bytes', async () => {
  await assert.rejects(numericBoundaryCases({ id:'x', template:{ gas:10 }, field:'gas', boundary:10, expectedFor:()=> 'accepted' }),/sign adapter/);
});
