import { getChainId, getReceipt, rpc, sanitizedRpcLabel } from './rpc.mjs';
import { describeRpcError, describeRpcResult, compareAdmission, HEX_TRANSACTION, txFingerprint } from './verdict.mjs';
import { assertTestChain, redact } from './safety.mjs';

const MATCHES = new Set(['EXPECTED_ACCEPT', 'EXPECTED_REJECT']);
const UNEXPECTED = new Set(['UNEXPECTED_ACCEPT', 'UNEXPECTED_REJECT', 'UNEXPECTED_RULE']);

export function endpointFor(p, { rpcUrl, rpcUrls = {} }) {
  const endpoint = rpcUrls[p.id] ?? rpcUrl;
  if (!endpoint) throw new Error(`Missing RPC endpoint for path ${p.id}`);
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('RPC endpoint must use HTTP(S)');
  return endpoint;
}

export async function runSuite(cases, options = {}) {
  const { allowChainId, submit = false, receiptWaitMs = 0, rpcTimeoutMs = 15000, rpcFn = rpc } = options;
  if (!Number.isSafeInteger(allowChainId) || allowChainId <= 0) throw new Error('Specify --allow-chain with the exact intended TESTNET chain ID');
  if (!Array.isArray(cases) || !cases.length) throw new Error('No test cases selected');
  const endpoints = new Set(cases.flatMap(c => c.paths.map(p => endpointFor(p, options))));
  for (const c of cases) for (const p of c.paths) if (p.adapterMode === 'MOCK' || p.metadata?.mode === 'MOCK') {
    const host = new URL(endpointFor(p, options)).hostname;
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) throw new Error('MOCK adapters can only use loopback endpoints');
  }
  // Check ALL endpoints before any setup, signing or broadcast (including builders).
  const preflightErrors = new Map();
  for (const url of endpoints) {
    let chain;
    try { chain = await getChainId(url, { timeoutMs: rpcTimeoutMs, rpcFn }); }
    catch (error) { preflightErrors.set(url, { ...describeRpcError(error), status: 'transport_failure' }); continue; }
    assertTestChain(chain, allowChainId);
  }
  const rawUses = new Map(), nonceUses = new Map();
  // Reject static duplicates before submitting even the first copy.
  for (const c of cases) for (const p of c.paths) {
    const raw = p.params?.[0];
    if (typeof raw === 'string' && HEX_TRANSACTION.test(raw)) rawUses.set(raw.toLowerCase(), (rawUses.get(raw.toLowerCase()) ?? 0) + 1);
    if (p.metadata?.sender && p.metadata?.nonce != null) {
      const key = `${String(p.metadata.sender).toLowerCase()}:${p.metadata.nonce}`;
      nonceUses.set(key, (nonceUses.get(key) ?? 0) + 1);
    }
  }
  const seenRaw = new Set(), seenNonce = new Set(), results = [];
  let submissions = 0;
  for (const c of cases) {
    const paths = [];
    for (const p of c.paths) {
      const url = endpointFor(p, options);
      const record = { id: p.id, method: p.method, expected: p.expected ?? null, expectedRule: p.expectedRule ?? null,
        expectedErrorClass: p.expectedErrorClass ?? null, rpc: sanitizedRpcLabel(url), receipt: { state: 'not_checked' } };
      let raw = p.params?.[0], metadata = p.metadata ?? null;
      try {
        if (preflightErrors.size) record.observed = preflightErrors.get(url) ?? { status: 'inconclusive', message: 'Another admission endpoint failed preflight; no setup or submission executed' };
        else if (!submit) record.observed = { status: 'inconclusive', message: 'Preview mode: no setup, signing, or submission executed' };
        else {
          if (p.prepare) { const built = await p.prepare({ rpcUrl: url, chainId: allowChainId }); raw = built.raw; metadata = built.metadata; }
          const key = metadata?.sender && metadata?.nonce != null ? `${String(metadata.sender).toLowerCase()}:${metadata.nonce}` : null;
          if (!['eth_sendFrameTransaction', 'eth_sendRawTransaction'].includes(p.method) || !HEX_TRANSACTION.test(raw ?? '')) {
            record.observed = { status: 'inconclusive', message: 'Missing signed bytes or unsupported method; placeholder never submitted' };
          } else if (c.paths.length > 1 && (!/^0x[\da-f]{40}$/i.test(metadata?.sender ?? '') || !/^(0|[1-9][0-9]*)$/.test(String(metadata?.nonce ?? '')))) {
            record.observed = { status: 'inconclusive', message: 'Comparative paths require sender and decimal nonce metadata; raw bytes alone cannot establish safe nonce isolation' };
          } else if (p.params && (!Array.isArray(p.params) || p.params.length !== 1)) {
            record.observed = { status: 'inconclusive', message: 'Submission requires exactly one signed transaction parameter' };
          } else if ((rawUses.get(raw.toLowerCase()) ?? 0) > 1 || seenRaw.has(raw.toLowerCase()) || (key && ((nonceUses.get(key) ?? 0) > 1 || seenNonce.has(key)))) {
            record.observed = { status: 'inconclusive', message: 'Unsafe duplicate payload or sender/nonce across admission paths/cases' };
          } else {
            seenRaw.add(raw.toLowerCase()); if (key) seenNonce.add(key);
            record.fingerprint = txFingerprint(raw);
            record.replay = { method: p.method, params: [raw], metadata, warning: 'Signed bytes may be stale. Rebuild with fresh account/state; do not automatically rebroadcast.' };
            submissions++;
            try { record.observed = describeRpcResult(await rpcFn(url, p.method, [raw], { timeoutMs: rpcTimeoutMs })); }
            catch (error) { record.observed = describeRpcError(error); }
            if (record.observed.status === 'accepted' && receiptWaitMs > 0) record.receipt = await getReceipt(url, record.observed.hash, { waitMs: receiptWaitMs, timeoutMs: rpcTimeoutMs, rpcFn });
          }
        }
      } catch (error) { record.observed = { status: 'inconclusive', errorClass: 'adapter_setup', message: redact(error.message) }; }
      record.metadata = metadata;
      record.comparison = compareAdmission(record.expected, record.observed, record.expectedRule, record.expectedErrorClass);
      paths.push(record);
    }
    results.push({ id: c.id, family: c.family ?? 'fixtures', category: c.category ?? 'General', description: c.description ?? '',
      mutation: c.mutation ?? null, ruleProvenance: c.ruleProvenance ?? null, reproduction: c.reproduction ?? null, sourceFile: c.sourceFile ?? null, notes: c.notes ?? '', paths,
      verdict: paths.some(p => UNEXPECTED.has(p.comparison.verdict)) ? 'UNEXPECTED'
        : paths.length && paths.every(p => MATCHES.has(p.comparison.verdict)) ? 'MATCH' : 'INCONCLUSIVE' });
  }
  const mock = options.evidenceSource === 'MOCK' || results.some(c => c.paths.some(p => p.metadata?.mode === 'MOCK'));
  return redact({ schema: 'framefuzz.evidence.v1', generatedAt: new Date().toISOString(),
    source: mock ? 'MOCK_RPC_TEST — NOT LIVE' : submissions ? 'LIVE_RPC_SUBMISSION' : 'PREVIEW_NO_SUBMISSION',
    chainId: allowChainId, rpc: [...endpoints].map(sanitizedRpcLabel).join(', '), submissions,
    receiptNote: 'Admission hash is not confirmation of execution. Inspect each receipt.state separately.', results,
    totals: { cases: results.length, matched: results.filter(c => c.verdict === 'MATCH').length,
      unexpected: results.filter(c => c.verdict === 'UNEXPECTED').length, inconclusive: results.filter(c => c.verdict === 'INCONCLUSIVE').length,
      transportFailures: results.flatMap(c => c.paths).filter(p => p.comparison.verdict === 'TRANSPORT_FAILURE').length } });
}
