import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RpcResponseError } from '../src/rpc.mjs';
import { describeRpcError, describeRpcResult, compareAdmission, TX_HASH } from '../src/verdict.mjs';

const hash = `0x${'a'.repeat(64)}`;
test('admission hash is accepted but never called an executed receipt', () => {
  assert.equal(describeRpcResult(hash).status, 'accepted');
  assert.match(describeRpcResult(hash).message, /inclusion NOT implied/);
  assert.equal(TX_HASH.test(hash), true);
});
test('JSON-RPC rejection versus transport error is distinguished', () => {
  assert.equal(describeRpcError(new RpcResponseError(-32000, 'StorageReadNonSender')).status, 'rejected');
  assert.equal(describeRpcError(new Error('ETIMEDOUT')).status, 'transport_failure');
});
test('matches expected rejection and expected rule', () => {
  const observed = { status: 'rejected', message: 'StorageReadNonSender violated' };
  assert.equal(compareAdmission('rejected', observed, 'StorageReadNonSender').verdict, 'EXPECTED_REJECT');
  assert.equal(compareAdmission('rejected', observed, 'BudgetLimit').verdict, 'UNEXPECTED_RULE');
});
test('intentional public/alt differences are not intrinsically anomalies', () => {
  assert.equal(compareAdmission('accepted', { status: 'accepted' }).verdict, 'EXPECTED_ACCEPT');
  assert.equal(compareAdmission('rejected', { status: 'rejected', message: 'StorageReadNonSender' }, 'StorageReadNonSender').verdict, 'EXPECTED_REJECT');
});

