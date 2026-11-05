import { createHash } from 'node:crypto';
import { RpcResponseError } from './rpc.mjs';

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
    return { status: 'rejected', code: error.code, message: error.message, data: typeof error.data === 'string' ? error.data.slice(0, 1500) : error.data ?? null };
  }
  return { status: 'inconclusive', code: null, message: error?.message ?? 'Unknown transport failure', errorType: error?.name ?? 'Error' };
}

// Rule matching is deliberately strict: a rejection without the expected rule
// is an unexpected *classification*, not a proven vulnerability.
export function compareAdmission(expected, observed, expectedRule = null) {
  if (!['accepted', 'rejected'].includes(expected)) return { verdict: 'INCONCLUSIVE', reason: 'Missing or invalid expected admission outcome' };
  if (!observed || observed.status === 'inconclusive') return { verdict: 'INCONCLUSIVE', reason: observed?.message ?? 'No observed result' };
  if (observed.status !== expected) return { verdict: 'UNEXPECTED', reason: `Expected ${expected}, observed ${observed.status}. Not automatically a protocol bug.` };
  if (expectedRule && expected === 'rejected') {
    const haystack = `${observed.message ?? ''} ${JSON.stringify(observed.data ?? '')}`.toLowerCase();
    const terms = Array.isArray(expectedRule) ? expectedRule : [expectedRule];
    if (!terms.some(term => haystack.includes(String(term).toLowerCase()))) {
      return { verdict: 'UNEXPECTED_RULE', reason: `Rejected, but response did not mention expected rule label(s): ${terms.join(' / ')}` };
    }
  }
  return { verdict: 'MATCH', reason: `Observed expected ${expected} decision.` };
}
