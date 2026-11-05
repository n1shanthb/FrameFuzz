import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCases } from './fixtures.mjs';
import { runSuite } from './runner.mjs';
import { listReports, loadReport, saveReport } from './reports.mjs';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}

export function createDashboardServer({ resultDir = 'runs', casesLocation = 'examples/cases', rpcUrl, allowChainId, submit = false, receiptWaitMs = 0 }) {
  let running = false;
  return http.createServer(async (req, res) => {
    const route = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && route.pathname === '/') {
        const html = await readFile(path.join(WEB_ROOT, 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(html);
      } else if (req.method === 'GET' && route.pathname === '/api/config') {
        json(res, 200, { rpcConfigured: Boolean(rpcUrl), submitEnabled: submit, allowChainId: allowChainId ?? null, casesLocation });
      } else if (req.method === 'GET' && route.pathname === '/api/runs') {
        json(res, 200, { runs: await listReports(resultDir) });
      } else if (req.method === 'GET' && route.pathname === '/api/run') {
        json(res, 200, await loadReport(resultDir, route.searchParams.get('id') || ''));
      } else if (req.method === 'POST' && route.pathname === '/api/run') {
        // Local-only dev server, no general network access, and explicit flag to submit.
        if (!submit || !rpcUrl || !Number.isSafeInteger(allowChainId)) return json(res, 409, { error: 'Live submissions are disabled. Restart server with --submit, --rpc, and --allow-chain.' });
        if (running) return json(res, 409, { error: 'A test run is already executing' });
        const origin = req.headers.origin;
        const host = req.headers.host;
        if (origin && new URL(origin).host !== host) return json(res, 403, { error: 'Invalid Origin' });
        running = true;
        try {
          const cases = await loadCases(casesLocation);
          const evidence = await runSuite(cases, { rpcUrl, allowChainId, submit: true, receiptWaitMs });
          const saved = await saveReport(evidence, resultDir);
          json(res, 200, { success: true, file: path.basename(saved.jsonFile), totals: evidence.totals });
        } finally { running = false; }
      } else json(res, 404, { error: 'Not found' });
    } catch (error) { json(res, 500, { error: error.message }); }
  });
}
