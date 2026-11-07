#!/usr/bin/env node
import path from 'node:path';
import { runSuite } from '../src/runner.mjs';
import { saveReport } from '../src/reports.mjs';
import { createDashboardServer } from '../src/server.mjs';
import { selectCases } from '../src/selection.mjs';
import { runMockDemo } from '../examples/mock-demo.mjs';
import { refreshEvidence } from '../src/refresh.mjs';
import { readFile } from 'node:fs/promises';
import {runMutationCampaign,replayMutationDescriptor} from '../src/mutations/campaign.mjs';
import {arkivCommand} from '../src/arkiv/cli.mjs';
import {redact} from '../src/safety.mjs';
import {prepareSavedDemo} from '../src/saved-demo.mjs';

const USAGE = `
FrameFuzz — EIP-8141 admission testing scaffold

Usage:
  node bin/framefuzz.mjs run <cases-dir|case.json|case.mjs> --rpc <testnet-url> --allow-chain <id> [--submit] [--receipt-wait-ms 5000] [--results runs]
  node --env-file=.env bin/framefuzz.mjs serve --mode LIVE_READ_ONLY --results runs --port 4177
  node bin/framefuzz.mjs serve --mode LIVE_AUTHORIZED --results runs [--rpc <testnet-url> --allow-chain <id> --submit]
  node bin/framefuzz.mjs demo --results runs
  node bin/framefuzz.mjs help
  node bin/framefuzz.mjs swarm offline --output runs/swarm-offline.json  # requires FRAMEFUZZ_SWARM=on
  node bin/framefuzz.mjs swarm sponsored-plan --investigation REPORT.json --context CONTEXT.json  # deterministic offline only
  node bin/framefuzz.mjs swarm verify-action --bundle BUNDLE.json  # candidate raw consistency; never live proof
  node bin/framefuzz.mjs swarm preflight --output runs/swarm-preflight.json  # read-only
  node bin/framefuzz.mjs swarm readiness --investigation REPORT.json --preflight PREFLIGHT.json --head HEAD.json  # prepare only; no signing or writes
  node bin/framefuzz.mjs swarm self-funded-readiness --investigation REPORT.json --preflight PREFLIGHT.json --head HEAD.json  # isolated offline variant; no funding or writes
  node bin/framefuzz.mjs swarm investigate --mode openrouter --output runs/investigation.json  # explicit model calls; no blockchain writes
  node bin/framefuzz.mjs swarm investigate --mode simulated --output runs/simulated.json
  node bin/framefuzz.mjs swarm replay regression.json --output runs/independent-replay.json
  node bin/framefuzz.mjs saved-demo --results runs/saved-demo --port 4177  # offline, wallet-free historical evidence
  node bin/framefuzz.mjs arkiv publish REPORT.json --case-index 0 --expiration-blocks 302400 --submit --output RECEIPT.json
  node bin/framefuzz.mjs arkiv query --suite verification-gas --rule MAX_VERIFY_GAS
  node bin/framefuzz.mjs arkiv fetch --key ENTITY_KEY
  node bin/framefuzz.mjs arkiv import --key ENTITY_KEY --results runs
  node bin/framefuzz.mjs mock-demo [--results runs]  # local fake gateways, never live evidence
  node bin/framefuzz.mjs refresh <evidence.json> --rpc URL --allow-chain ID [--receipt-wait-ms 1000]  # read-only; no submission
  node bin/framefuzz.mjs mutate --suite verification-gas|uniswap-storage --seed 42 --count 7 --preview
  node bin/framefuzz.mjs mutate --suite verification-gas --seed 42 --count 7 --submit --allow-chain 1337
  node bin/framefuzz.mjs mutate --replay RUN.replay.json --variant INDEX --preview
  Mutation options: --variant INDEX --definition FILE --rules FILE --config FILE. Preview is offline; live batches are capped at seven variants.

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
    if (name === 'submit' || name === 'preview' || name === 'offline') { result[name] = true; continue; }
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
  if(command==='swarm'){
    const {assertSwarmEnabled}=await import('../src/swarm/gate.mjs');assertSwarmEnabled();
    if(rest.some(x=>['--deploy','--submit','--publish'].includes(x)))throw new Error('Swarm milestones 1–2 cannot deploy, broadcast or publish; separate human approval required');
    const {swarmCommand}=await import('../src/swarm/cli.mjs');return swarmCommand(flags(rest));
  }
  const options = flags(rest);
  const resultDir = options.results ?? 'runs';
  if(command==='arkiv')return arkivCommand(options);
  if (command === 'mutate') {
    const mutationOptions={suite:options.suite??'verification-gas',seed:numericArg(options.seed,42),count:numericArg(options.count,options.suite==='uniswap-storage'?3:7),
      preview:Boolean(options.preview),submit:Boolean(options.submit),allowChainId:numericArg(options['allow-chain'],null),variant:numericArg(options.variant,undefined),
      rulesFile:options.rules,configFile:options.config,definitionFile:options.definition,receiptWaitMs:numericArg(options['receipt-wait-ms'],1000),
      rpcUrl:options.rpc??process.env.FRAMEFUZZ_RPC,rpcUrls:{public:options['public-rpc']??process.env.FRAMEFUZZ_PUBLIC_RPC,alt:options['alt-rpc']??process.env.FRAMEFUZZ_ALT_RPC}};
    let evidence;
    if(options.replay){
      const file=JSON.parse(await readFile(options.replay,'utf8'));
      const descriptorFor=c=>c?.semanticDescriptor?.reproduction?.schema==='framefuzz.mutation-reproduction.v1'?c.semanticDescriptor.reproduction:c?.reproduction;
      const selected=mutationOptions.variant===undefined?file.cases?.[0]:file.cases?.find(c=>descriptorFor(c)?.variantIndex===mutationOptions.variant);
      const descriptor=file.schema==='framefuzz.mutation-reproduction.v1'?file:descriptorFor(selected);
      if(!descriptor)throw new Error('Replay file has no selected mutation reproduction descriptor');
      evidence=await replayMutationDescriptor(descriptor,mutationOptions);
    }else evidence=await runMutationCampaign(mutationOptions);
    console.log(JSON.stringify({source:evidence.source,campaign:evidence.campaign,totals:evidence.totals,submissions:evidence.submissions,coverage:evidence.coverage,
      generated:evidence.results.map(c=>({id:c.id,parameters:c.mutation.parameter,oracles:c.paths.map(p=>({path:p.id,ruleId:p.oracle.ruleId,expected:p.oracle.expected,confidence:p.oracle.confidence,reason:p.oracle.reason,components:p.oracle.components}))})),evidence:await saveReport(evidence,resultDir)},null,2));
    if(evidence.totals.unexpected)process.exitCode=2;else if(options.submit&&evidence.totals.inconclusive)process.exitCode=3;
  } else if (command === 'run') {
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
  } else if (command === 'refresh') {
    if (!options._[0]) throw new Error('Refresh requires an evidence JSON file');
    const original = JSON.parse(await readFile(options._[0], 'utf8'));
    const evidence = await refreshEvidence(original, {rpcUrl:options.rpc ?? process.env.FRAMEFUZZ_RPC,
      rpcUrls:{public:options['public-rpc'] ?? process.env.FRAMEFUZZ_PUBLIC_RPC,alt:options['alt-rpc'] ?? process.env.FRAMEFUZZ_ALT_RPC},
      allowChainId:numericArg(options['allow-chain'],null),receiptWaitMs:numericArg(options['receipt-wait-ms'],1000)});
    evidence.derivedFrom = path.basename(options._[0]);
    console.log(JSON.stringify({totals:evidence.totals,evidence:await saveReport(evidence,resultDir)},null,2));
    if(evidence.totals.unexpected)process.exitCode=2;else if(evidence.totals.inconclusive)process.exitCode=3;
  } else if (command === 'serve' || command==='saved-demo') {
    if((command==='saved-demo'||options.offline)&&options.submit)throw new Error('Offline saved demonstration cannot enable submission');
    const demo=command==='saved-demo'?await prepareSavedDemo(resultDir):null;
    const port = numericArg(options.port, 4177);
    const bind = options.bind
      ?? process.env.FRAMEFUZZ_BIND
      ?? (process.env.FRAMEFUZZ_ALLOW_PUBLIC_HOST === '1' ? '0.0.0.0' : '127.0.0.1');
    if (bind !== '127.0.0.1' && process.env.FRAMEFUZZ_ALLOW_PUBLIC_HOST !== '1') {
      throw new Error('Non-loopback bind requires FRAMEFUZZ_ALLOW_PUBLIC_HOST=1');
    }
    const server = createDashboardServer({
      resultDir, casesLocation: options.cases ?? 'examples/cases',
      rpcUrl: options.rpc ?? process.env.FRAMEFUZZ_RPC,
      rpcUrls: { public: options['public-rpc'] ?? process.env.FRAMEFUZZ_PUBLIC_RPC, alt: options['alt-rpc'] ?? process.env.FRAMEFUZZ_ALT_RPC },
      scenario: options.scenario, adapterFile: options.adapter, rulesFile: options.rules,
      mutationConfigFile:options.config,mutationRulesFile:options['mutation-rules'],
      allowChainId: numericArg(options['allow-chain'], null),
      submit: Boolean(options.submit), receiptWaitMs: numericArg(options['receipt-wait-ms'], 0),
      offlineDemo:command==='saved-demo'||Boolean(options.offline),defaultRun:demo?.defaultRun,capabilityMode:options.mode,
    });
    server.listen(port, bind, () => console.log(`FrameFuzz dashboard: http://${bind === '0.0.0.0' ? '0.0.0.0' : '127.0.0.1'}:${port}\nLive submission: ${options.submit ? 'enabled with chain guard' : 'DISABLED'}`));
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
main().catch(error => { console.error(`FrameFuzz error: ${redact(error.message)}`); process.exitCode = 1; });
