import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectCases } from './selection.mjs';
import { runSuite } from './runner.mjs';
import { listReports, loadReport, saveReport, toMarkdown, toReplay } from './reports.mjs';
import { SCENARIOS } from './scenarios.mjs';
import { getChainId, sanitizedRpcLabel } from './rpc.mjs';
import { assertTestChain, redact } from './safety.mjs';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}

export function createDashboardServer({ resultDir = 'runs', casesLocation = 'examples/cases', rpcUrl, rpcUrls = {}, scenario, adapterFile, rulesFile, allowChainId, submit = false, receiptWaitMs = 0 }) {
  let running = false;
  const configured = Boolean(rpcUrl || (rpcUrls.public && rpcUrls.alt));
  const enabled = Boolean(submit && configured && Number.isSafeInteger(allowChainId) && allowChainId > 1);
  return http.createServer(async (req, res) => {
    const route = new URL(req.url, 'http://localhost');
    try {
      const requestHost = new URL(`http://${req.headers.host ?? ''}`).hostname;
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(requestHost)) return json(res, 403, { error: 'Localhost Host header required' });
      if (req.method === 'GET' && route.pathname === '/') {
        const html = await readFile(path.join(WEB_ROOT, 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(html);
      } else if (req.method === 'GET' && route.pathname === '/api/config') {
        json(res, 200, { rpcConfigured: configured, submitEnabled: enabled, allowChainId: allowChainId ?? null, casesLocation, running,
          scenario: scenario ?? 'fixtures', scenarios: [{ id: 'fixtures', label: 'Signed case fixtures' }, ...(adapterFile && rulesFile ? SCENARIOS : [])],
          endpoints: Object.fromEntries(Object.entries({ default: rpcUrl, ...rpcUrls }).filter(([,v]) => v).map(([k,v]) => [k, sanitizedRpcLabel(v)])) });
      } else if (req.method === 'GET' && route.pathname === '/api/network') {
        const endpoints = Object.entries({ default: rpcUrl, ...rpcUrls }).filter(([, v]) => v);
        const status = await Promise.all(endpoints.map(async ([id, url]) => {
          try { const chainId = await getChainId(url, { timeoutMs: 3000 }); assertTestChain(chainId, allowChainId); return { id, rpc: sanitizedRpcLabel(url), chainId, state: 'ready' }; }
          catch (error) { return { id, rpc: sanitizedRpcLabel(url), state: 'unavailable', message: redact(error.message) }; }
        }));
        json(res, 200, { endpoints: status });
      } else if (req.method === 'GET' && route.pathname === '/api/cases') {
        const selected = route.searchParams.get('scenario') ?? scenario ?? 'fixtures';
        const cases = await selectCases({ casesLocation, scenario: selected, adapterFile, rulesFile });
        json(res, 200, { cases: cases.map(c => ({ id: c.id, family: c.family ?? 'fixtures', mutation: c.mutation?.family ?? 'baseline' })) });
      } else if (req.method === 'GET' && route.pathname === '/api/runs') {
        json(res, 200, { runs: await listReports(resultDir) });
      } else if (req.method === 'GET' && route.pathname === '/api/run') {
        json(res, 200, await loadReport(resultDir, route.searchParams.get('id') || ''));
      } else if (req.method === 'GET' && route.pathname === '/api/export') {
        const report = await loadReport(resultDir, route.searchParams.get('id') || '');
        const format = route.searchParams.get('format') ?? 'json';
        if (!['json', 'markdown', 'replay'].includes(format)) return json(res, 400, { error: 'Unknown export format' });
        const content = format === 'markdown' ? toMarkdown(report) : JSON.stringify(format === 'replay' ? toReplay(report) : redact(report), null, 2);
        res.writeHead(200, { 'content-type': format === 'markdown' ? 'text/markdown; charset=utf-8' : 'application/json',
          'content-disposition': `attachment; filename="framefuzz-${format}.${format === 'markdown' ? 'md' : 'json'}"`, 'x-content-type-options': 'nosniff' });
        res.end(content);
      } else if (req.method === 'POST' && route.pathname === '/api/run') {
        // Local-only dev server, no general network access, and explicit flag to submit.
        if (!enabled) return json(res, 409, { error: 'Submissions are disabled. Configure RPC endpoints, --allow-chain, and --submit.' });
        if (running) return json(res, 409, { error: 'A test run is already executing' });
        const origin = req.headers.origin;
        const host = req.headers.host;
        if (origin && new URL(origin).host !== host) return json(res, 403, { error: 'Invalid Origin' });
        running = true;
        try {
          let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 4096) return json(res, 413, { error: 'Selection too large' }); }
          let selection; try { selection = body ? JSON.parse(body) : {}; } catch { return json(res, 400, { error: 'Invalid JSON selection' }); }
          const cases = await selectCases({ casesLocation, scenario: selection.scenario ?? scenario, adapterFile, rulesFile,
            caseId: selection.caseId, mutationFamily: selection.mutationFamily });
          const evidence = await runSuite(cases, { rpcUrl, rpcUrls, allowChainId, submit: true, receiptWaitMs });
          const saved = await saveReport(evidence, resultDir);
          json(res, 200, { success: true, file: path.basename(saved.jsonFile), totals: evidence.totals });
        } finally { running = false; }
      } else json(res, 404, { error: 'Not found' });
    } catch (error) { json(res, 500, { error: redact(error.message) }); }
  });
}
