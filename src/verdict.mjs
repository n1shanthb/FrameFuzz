import { createHash } from 'node:crypto';
import { RpcResponseError } from './rpc.mjs';
import { redact } from './safety.mjs';

export const HEX_TRANSACTION = /^0x(?:[\da-f]{2})+$/i;
export const TX_HASH = /^0x[\da-f]{64}$/i;

export function txFingerprint(raw) {
  return typeof raw === 'string' ? createHash('sha256').update(raw).digest('hex').slice(0, 16) : null;
}

export function describeRpcResult(value) {
  if (typeof value === 'string' && TX_HASH.test(value)) return { status: 'accepted', hash: value, message: 'Submission RPC returned a transaction hash; inclusion NOT implied.' };
  return { status: 'inconclusive', hash: null, message: `Submission response not recognized as a hash: ${String(value).slice(0, 150)}` };
}

export function describeRpcError(error) {
  if (error instanceof RpcResponseError) {
    const text = `${error.message} ${JSON.stringify(error.data ?? '')}`;
    // Both real gateways wrap policy failures in "Invalid params" / -32602.
    // Recognize only concrete, source-reviewed policy diagnostics before that wrapper.
    const policy = /validation-prefix simulation failed:\s*StorageReadNonSender\b|prefix gas budget \(frames \+ sig cost\) exceeds MAX_VERIFY_GAS|validation prefix execution gas sum \d+ \+ signature-verification cost \d+ = \d+ exceeds MAX_VERIFY_GAS/i.test(text);
    const errorClass = /no space left on device|disk full|rocksdb.*IO error/i.test(text)?'gateway_infrastructure':policy ? 'admission_policy' : error.code === -32601 ? 'rpc_method' : error.code === -32602 || /invalid params|malformed|rlp|invalid signature|invalid sender|decode|encoding/i.test(text) ? 'malformed_transaction'
      : /nonce|already known|replacement transaction|underpriced/i.test(text) ? 'nonce_or_duplicate'
      : /insufficient funds|insufficient balance|balance too low/i.test(text) ? 'funding'
      : error.code === -32603 || error.code === -32700 ? 'rpc_error' : 'unclassified_rejection';
    return { status: 'rejected', errorClass, code: error.code, message: redact(error.message), data: redact(typeof error.data === 'string' ? error.data.slice(0, 1500) : error.data ?? null) };
  }
  return { status: 'transport_failure', code: null, message: redact(error?.message ?? 'Unknown transport failure'), errorType: error?.name ?? 'Error' };
}

// Rule matching is deliberately strict: a rejection without the expected rule
// is an unexpected *classification*, not a proven vulnerability.
export function compareAdmission(expected, observed, expectedRule = null, expectedErrorClass = null) {
  if (observed?.status === 'transport_failure') return { verdict: 'TRANSPORT_FAILURE', reason: observed.message };
  if (!['accepted', 'rejected'].includes(expected)) return { verdict: 'INCONCLUSIVE', reason: 'Missing or invalid expected admission outcome' };
  if (!observed || observed.status === 'inconclusive') return { verdict: 'INCONCLUSIVE', reason: observed?.message ?? 'No observed result' };
  if (expectedErrorClass && observed.status === 'rejected' && observed.errorClass !== expectedErrorClass) return { verdict: 'UNEXPECTED_RULE', reason: `Expected error class ${expectedErrorClass}, observed ${observed.errorClass}` };
  if (observed.status === 'rejected' && !expectedErrorClass && !['admission_policy', 'unclassified_rejection', undefined].includes(observed.errorClass)) return { verdict: 'INCONCLUSIVE', reason: `Precondition/RPC error (${observed.errorClass}) is not an admission-policy finding` };
  if (observed.status !== expected) return { verdict: observed.status === 'accepted' ? 'UNEXPECTED_ACCEPT' : 'UNEXPECTED_REJECT', reason: `Expected ${expected}, observed ${observed.status}. Not automatically a protocol bug.` };
  if (expectedRule && expected === 'rejected') {
    const haystack = `${observed.message ?? ''} ${JSON.stringify(observed.data ?? '')}`.toLowerCase();
    const terms = Array.isArray(expectedRule) ? expectedRule : [expectedRule];
    if (!terms.some(term => haystack.includes(String(term).toLowerCase()))) {
      return { verdict: 'UNEXPECTED_RULE', reason: `Rejected, but response did not mention expected rule label(s): ${terms.join(' / ')}` };
    }
  }
  if (expected === 'rejected' && !expectedRule && !expectedErrorClass) return { verdict: 'INCONCLUSIVE', reason: 'Rejection observed but no grounded rule/error-class expectation supplied' };
  return { verdict: expected === 'accepted' ? 'EXPECTED_ACCEPT' : 'EXPECTED_REJECT', reason: `Observed expected ${expected} decision.` };
}
