#!/usr/bin/env node
import path from 'node:path';
import { runSuite } from '../src/runner.mjs';
import { saveReport } from '../src/reports.mjs';
import { createDashboardServer } from '../src/server.mjs';
import { selectCases } from '../src/selection.mjs';
import { runMockDemo } from '../examples/mock-demo.mjs';

const USAGE = `
FrameFuzz — EIP-8141 admission testing scaffold

Usage:
  node bin/framefuzz.mjs run <cases-dir|case.json|case.mjs> --rpc <testnet-url> --allow-chain <id> [--submit] [--receipt-wait-ms 5000] [--results runs]
  node bin/framefuzz.mjs serve --results runs [--cases examples/cases] [--port 4177] [--rpc <testnet-url> --allow-chain <id> --submit]
  node bin/framefuzz.mjs demo --results runs
  node bin/framefuzz.mjs help
  node bin/framefuzz.mjs mock-demo [--results runs]  # local fake gateways, never live evidence

Scenario options (run/serve): --scenario uniswap-v4-paymaster|verification-gas --adapter plugin.mjs --rules rules.json
Path options: --public-rpc URL --alt-rpc URL (or FRAMEFUZZ_PUBLIC_RPC / FRAMEFUZZ_ALT_RPC environment variables)
Filters: --case CASE_ID --mutation all|baseline|verification-gas

Safety: No transaction is sent unless --submit is present and the RPC's chain ID equals --allow-chain.
Only chain IDs other than 1 are supported. DO NOT use real money, mainnet keys, or shared production endpoints.
An admission hash is not proof of block inclusion or successful execution.
`;
function flags(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (!x.startsWith('--')) { result._.push(x); continue; }
    const name = x.slice(2);
    if (name === 'submit') { result.submit = true; continue; }
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`Missing value for ${x}`);
    result[name] = argv[++i];
  }
  return result;
}
function numericArg(value, fallback) {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Expected a nonnegative integer, got ${value}`);
  return n;
}

async function main() {
  const [command = 'help', ...rest] = process.argv.slice(2);
  if (command === 'help' || command === '--help') return process.stdout.write(USAGE);
  const options = flags(rest);
  const resultDir = options.results ?? 'runs';
  if (command === 'run') {
    const location = options._[0] ?? options.cases ?? 'examples/cases';
    const cases = await selectCases({ casesLocation: location, scenario: options.scenario, adapterFile: options.adapter, rulesFile: options.rules, caseId: options.case, mutationFamily: options.mutation });
    const evidence = await runSuite(cases, {
      rpcUrl: options.rpc ?? process.env.FRAMEFUZZ_RPC,
      rpcUrls: { public: options['public-rpc'] ?? process.env.FRAMEFUZZ_PUBLIC_RPC, alt: options['alt-rpc'] ?? process.env.FRAMEFUZZ_ALT_RPC },
      allowChainId: numericArg(options['allow-chain'], null),
      submit: Boolean(options.submit), receiptWaitMs: numericArg(options['receipt-wait-ms'], 0),
    });
    const saved = await saveReport(evidence, resultDir);
    console.log(JSON.stringify({ totals: evidence.totals, source: evidence.source, evidence: saved }, null, 2));
    if (evidence.totals.unexpected > 0) process.exitCode = 2;
    else if (evidence.totals.inconclusive > 0) process.exitCode = 3;
  } else if (command === 'serve') {
    const port = numericArg(options.port, 4177);
    const server = createDashboardServer({
      resultDir, casesLocation: options.cases ?? 'examples/cases',
      rpcUrl: options.rpc ?? process.env.FRAMEFUZZ_RPC,
      rpcUrls: { public: options['public-rpc'] ?? process.env.FRAMEFUZZ_PUBLIC_RPC, alt: options['alt-rpc'] ?? process.env.FRAMEFUZZ_ALT_RPC },
      scenario: options.scenario, adapterFile: options.adapter, rulesFile: options.rules,
      allowChainId: numericArg(options['allow-chain'], null),
      submit: Boolean(options.submit), receiptWaitMs: numericArg(options['receipt-wait-ms'], 0),
    });
    server.listen(port, '127.0.0.1', () => console.log(`FrameFuzz dashboard: http://127.0.0.1:${port}\nLive submission: ${options.submit ? 'enabled with chain guard' : 'DISABLED'}`));
  } else if (command === 'mock-demo') {
    console.log(JSON.stringify(await runMockDemo(resultDir), null, 2));
  } else if (command === 'demo') {
    const synthetic = {
      schema: 'framefuzz.evidence.v1', generatedAt: new Date().toISOString(), source: 'SYNTHETIC_UI_DEMO — NO RPC CALLS',
      rpc: '[not connected]', chainId: 1337, receiptNote: 'Synthetic visual demo; no transactions sent',
      totals: { cases: 3, matched: 2, unexpected: 1, inconclusive: 0 },
      results: [
        { id: 'synthetic-baseline', category: 'Baseline', description: 'Demonstration-only accepted frame', verdict: 'MATCH', paths: [{ id: 'alt', expected: 'accepted', observed: { status: 'accepted', hash: null, message: 'SYNTHETIC' }, comparison: { verdict: 'MATCH', reason: 'Synthetic result' }, receipt: { state: 'not_checked' } }] },
        { id: 'synthetic-rule-boundary', category: 'Storage access', description: 'Demonstration-only rejection', verdict: 'MATCH', paths: [{ id: 'canonical', expected: 'rejected', observed: { status: 'rejected', message: 'SYNTHETIC rule violation' }, comparison: { verdict: 'MATCH', reason: 'Synthetic result' } }] },
        { id: 'synthetic-unexpected', category: 'Gas boundary', description: 'Illustrative discrepancy, NOT a discovered bug', verdict: 'UNEXPECTED', paths: [{ id: 'alt', expected: 'rejected', observed: { status: 'accepted', message: 'SYNTHETIC' }, comparison: { verdict: 'UNEXPECTED', reason: 'Synthetic mismatch; not a protocol finding' }, receipt: { state: 'not_checked' } }] },
      ],
    };
    const saved = await saveReport(synthetic, resultDir);
    console.log(`Wrote clearly labeled SYNTHETIC visual-only evidence: ${path.basename(saved.jsonFile)}\nOpen via: npm start`);
  } else throw new Error(`Unknown command ${command}. Use help.`);
}
main().catch(error => { console.error(`FrameFuzz error: ${error.message}`); process.exitCode = 1; });
