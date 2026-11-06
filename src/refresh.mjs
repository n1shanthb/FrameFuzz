import { rpc, getChainId, getReceipt } from './rpc.mjs';
import { assertTestChain } from './safety.mjs';
import { endpointFor } from './runner.mjs';
import { RpcResponseError } from './rpc.mjs';
import { describeRpcError, compareAdmission } from './verdict.mjs';
import {compareMutation} from './mutations/oracle.mjs';
import {mutationCoverage} from './mutations/campaign.mjs';

/** Reclassify captured responses and optionally refresh receipts. Never submits. */
export async function refreshEvidence(report, { rpcUrls, rpcUrl, allowChainId, receiptWaitMs = 1000, rpcFn = rpc } = {}) {
  const output = structuredClone(report);
  if (output.schema !== 'framefuzz.evidence.v1') throw new Error('Not a FrameFuzz evidence report');
  if (!output.source.startsWith('LIVE_RPC_SUBMISSION')) throw new Error('Receipt refresh only accepts LIVE evidence');
  if (allowChainId !== output.chainId) throw new Error('Refresh chain ID must match original evidence');
  const urls = new Set(output.results.flatMap(c=>c.paths.map(p=>endpointFor(p,{rpcUrls,rpcUrl}))));
  for (const url of urls) assertTestChain(await getChainId(url,{rpcFn}),allowChainId);
  output.refreshedAt = new Date().toISOString();
  for (const c of output.results) {
    for (const p of c.paths) {
      if (p.observed.status === 'rejected') p.observed = describeRpcError(new RpcResponseError(p.observed.code,p.observed.message,p.observed.data));
      if (p.observed.status === 'accepted') {
        if (!Object.hasOwn(p,'historicalReceipt')) p.historicalReceipt=structuredClone(p.receipt??null);
        p.receipt = await getReceipt(endpointFor(p,{rpcUrls,rpcUrl}),p.observed.hash,{waitMs:receiptWaitMs,rpcFn});
        p.receiptObservations=[...(p.receiptObservations??[]),{checkedAt:output.refreshedAt,receipt:structuredClone(p.receipt)}];
      }
      p.comparison = p.oracle?compareMutation(p.oracle,p.observed):compareAdmission(p.expected,p.observed,p.expectedRule,p.expectedErrorClass);
    }
    c.verdict = c.paths.some(p=>p.comparison.verdict.startsWith('UNEXPECTED')) ? 'UNEXPECTED'
      : c.paths.length && c.paths.every(p=>p.comparison.verdict.startsWith('EXPECTED_')) ? 'MATCH' : 'INCONCLUSIVE';
    if(c.reproduction?.schema==='framefuzz.mutation-reproduction.v1')c.reproduction.decisions=c.paths.map(p=>({path:p.id,oracle:p.oracle,observed:p.observed,receipt:p.receipt,admissionReport:p.admissionReport,replay:p.replay}));
  }
  if(output.campaign)output.coverage=mutationCoverage(output.results);
  output.totals = { cases:output.results.length, matched:output.results.filter(c=>c.verdict==='MATCH').length,
    unexpected:output.results.filter(c=>c.verdict==='UNEXPECTED').length,inconclusive:output.results.filter(c=>c.verdict==='INCONCLUSIVE').length,
    transportFailures:output.results.flatMap(c=>c.paths).filter(p=>p.comparison.verdict==='TRANSPORT_FAILURE').length,
    ...(output.campaign?{preconditionFailures:output.results.flatMap(c=>c.paths).filter(p=>p.comparison.verdict==='PRECONDITION_FAILURE').length}:{}) };
  return output;
}
