import { getChainId, getReceipt, rpc, sanitizedRpcLabel } from './rpc.mjs';
import { describeRpcError, describeRpcResult, compareAdmission, HEX_TRANSACTION, txFingerprint } from './verdict.mjs';

export async function runSuite(cases, { rpcUrl, allowChainId, submit = false, receiptWaitMs = 0, rpcTimeoutMs = 15000, rpcFn = rpc } = {}) {
  if (!rpcUrl) throw new Error('Missing RPC endpoint');
  if (!Number.isSafeInteger(allowChainId) || allowChainId <= 0) throw new Error('Specify --allow-chain with the exact intended TESTNET chain ID');
  const chainId = await getChainId(rpcUrl, { timeoutMs: rpcTimeoutMs });
  if (chainId !== allowChainId) throw new Error(`SAFETY STOP: RPC is chain ${chainId}, but --allow-chain is ${allowChainId}`);
  if (chainId === 1) throw new Error('SAFETY STOP: mainnet submissions are disabled');
  const results = [];
  for (const testCase of cases) {
    const paths = [];
    for (const p of testCase.paths) {
      const expected = p.expected ?? null;
      const raw = p.params?.[0];
      const record = {
        id: p.id || p.method, method: p.method, expected, expectedRule: p.expectedRule ?? null,
        fingerprint: txFingerprint(raw),
      };
      if (!['eth_sendFrameTransaction','eth_sendRawTransaction'].includes(p.method) || !Array.isArray(p.params) || p.params.length !== 1 || !HEX_TRANSACTION.test(raw ?? '')) {
        record.observed = { status: 'inconclusive', message: 'Missing real signed hexadecimal transaction or unsupported submission method. Never submit a placeholder.' };
      } else if (!submit) {
        record.observed = { status: 'inconclusive', message: 'Preview mode. Re-run with --submit to broadcast on the explicitly allowed TESTNET.' };
      } else {
        try {
          const result = await rpcFn(rpcUrl, p.method, p.params, { timeoutMs: rpcTimeoutMs });
          record.observed = describeRpcResult(result);
          if (record.observed.status === 'accepted') {
            record.receipt = receiptWaitMs > 0
              ? await getReceipt(rpcUrl, record.observed.hash, { waitMs: receiptWaitMs, timeoutMs: rpcTimeoutMs })
              : { state: 'not_checked' };
          }
        } catch (e) { record.observed = describeRpcError(e); }
      }
      record.comparison = compareAdmission(expected, record.observed, p.expectedRule);
      paths.push(record);
    }
    results.push({
      id: testCase.id, category: testCase.category || 'General', description: testCase.description || '',
      mutation: testCase.mutation ?? null,
      sourceFile: testCase.sourceFile ?? null,
      notes: testCase.notes || '', paths,
      verdict: paths.some(p => ['UNEXPECTED', 'UNEXPECTED_RULE'].includes(p.comparison.verdict)) ? 'UNEXPECTED'
        : paths.every(p => p.comparison.verdict === 'MATCH') && paths.length ? 'MATCH' : 'INCONCLUSIVE',
    });
  }
  return {
    schema: 'framefuzz.evidence.v1',
    generatedAt: new Date().toISOString(),
    source: submit ? 'LIVE_RPC_SUBMISSION' : 'PREVIEW_NO_SUBMISSION',
    rpc: sanitizedRpcLabel(rpcUrl), chainId,
    receiptNote: 'Admission hash is not confirmation of execution. Inspect each receipt.state separately.',
    results,
    totals: {
      cases: results.length,
      matched: results.filter(c => c.verdict === 'MATCH').length,
      unexpected: results.filter(c => c.verdict === 'UNEXPECTED').length,
      inconclusive: results.filter(c => c.verdict === 'INCONCLUSIVE').length,
    },
  };
}
