import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { redact } from './safety.mjs';
import {evidenceView,savedEvidenceClass} from './evidence-status.mjs';

const slug = x => String(x).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);

export function toMarkdown(output) {
  output = redact(evidenceView(output));
  const lines = [
    '# FrameFuzz admission evidence', '',
    `- Source: **${output.source}**`,
    `- Evidence class: **${output.evidenceClassification}**`,
    `- Chain ID: **${output.chainId}**`,
    `- RPC host: ${output.rpc}`,
    `- Generated: ${output.generatedAt}`, '',
    '> A submission RPC hash proves an admission response, not block inclusion or successful execution.', '',
    '| Test | Path | Expected | Observed | Verdict | Receipt |',
    '|---|---|---|---|---|---|',
  ];
  for (const c of output.results) for (const p of c.paths) {
    lines.push(`| ${c.id} | ${p.id} | ${p.expected ?? '-'} | ${p.observed.status} | ${p.comparison.verdict} | ${p.receipt?.state ?? '-'} |`);
  }
  if(output.coverage){
    lines.push('','## Mutation campaign and rule coverage','',`- Campaign: ${JSON.stringify(output.campaign)}`);
    for(const rule of output.coverage.rules)lines.push(`- ${rule.ruleId} / ${rule.path}: ${rule.variants} variants, ${rule.matched} matching decisions, ${rule.unexpected} unexpected, regions ${rule.regions.join(', ')}; verified ${rule.verified}, inferred ${rule.inferred}, unknown ${rule.unknown}`);
  }
  if(output.communityOrigin)lines.push('','## Community origin (historical publisher claims)', '', 'This run is a new unsigned PREVIEW. Original receipts below are not newly rerun outcomes.', '', '```json',JSON.stringify(output.communityOrigin,null,2),'```');
  lines.push('', '## Details', '');
  for (const c of output.results) {
    lines.push(`### ${c.id}`, '', c.description, '');
    for (const p of c.paths) {
      lines.push(`- **${p.id}:** ${p.comparison.reason}`);
      if (p.observed.hash) lines.push(`  - Transaction: \`${p.observed.hash}\``);
      if (p.observed.message) lines.push(`  - RPC response: ${p.observed.message.replaceAll('\n', ' ').slice(0, 500)}`);
      if (p.receipt) lines.push(`  - Receipt: ${p.receipt.state}, block ${p.receipt.blockNumber ?? 'unconfirmed'}`);
      if (p.rpc) lines.push(`  - Admission endpoint: ${p.rpc}`);
      if (p.metadata) lines.push(`  - Replay metadata: ${JSON.stringify(p.metadata)}`);
      if(p.oracle)lines.push(`  - Rule oracle: ${JSON.stringify(p.oracle)}`);
    }
    if (c.mutation) lines.push(`- Mutation: ${JSON.stringify(c.mutation)}`);
    if (c.ruleProvenance) lines.push(`- Rule provenance: ${JSON.stringify(c.ruleProvenance)}`);
    if(c.reproduction?.cli)lines.push(`- Fresh-signature reproduction: \`${c.reproduction.cli}\``);
    if (c.sourceFile) lines.push(`- Reproduction fixture: \`${c.sourceFile}\``);
    lines.push('');
  }
  return lines.join('\n');
}

export async function saveReport(output, directory) {
  output = redact(evidenceView(output));
  await mkdir(directory, { recursive: true });
  const base = `${new Date().toISOString().replace(/[:.]/g, '-')}-${slug(output.source)}-${randomUUID().slice(0, 8)}`;
  const jsonFile = path.resolve(directory, `${base}.json`);
  const mdFile = path.resolve(directory, `${base}.md`);
  const replayFile = path.resolve(directory, `${base}.replay.json`);
  await Promise.all([
    writeFile(jsonFile, JSON.stringify(output, null, 2) + '\n'),
    writeFile(mdFile, toMarkdown(output).trimEnd() + '\n'),
    writeFile(replayFile, JSON.stringify(toReplay(output), null, 2) + '\n'),
  ]);
  return { jsonFile, mdFile, replayFile };
}

export function toReplay(output) {
  return redact({ schema: 'framefuzz.replay.v1', source: output.source,evidenceClassification:savedEvidenceClass(output), chainId: output.chainId,campaign:output.campaign,coverage:output.coverage,communityOrigin:output.communityOrigin,
    broadcastAllowed: false,
    reproductionKind: output.campaign ? 'SEMANTIC_REGENERATION_WITH_HISTORICAL_RECORDS' : 'HISTORICAL_RECORDS_ONLY',
    historicalSignedData: output.results.some(c=>c.paths.some(p=>p.replay?.signedRaw)),
    freshSigningRequired: true,
    warning: 'Contains potentially stale signed bytes. Rebuild with the original signer and isolated state. No automatic broadcast is performed.',
    cases: output.results.map(c => ({ id: c.id, family: c.family, mutation: c.mutation, ruleProvenance: c.ruleProvenance, reproduction: c.reproduction,
      semanticDescriptor: semanticReplay(c),
      historicalOutcomes: c.paths.map(p=>({id:p.id,observed:p.observed,receipt:p.receipt})),
      paths: c.paths.filter(p => p.replay).map(p => ({ id: p.id, expected: p.expected, expectedRule: p.expectedRule,oracle:p.oracle,observed:p.observed,receipt:p.receipt,admissionReport:p.admissionReport, ...p.replay })) })) });
}

function semanticReplay(c) {
  const source=c.reproduction??{};
  const fields=['schema','generatorVersion','definition','definitionDigest','variantIndex','baseTemplateId','unsignedModel','setup','oracle','accountAllocation'];
  const reproduction=Object.fromEntries(fields.filter(key=>source[key]!==undefined).map(key=>[key,source[key]]));
  return {mutation:c.mutation??null,reproduction,
    previewCli:typeof source.cli==='string'?source.cli.replace(/--submit(?:\s+--allow-chain\s+\d+)?/g,'--preview'):null,
    broadcastAllowed:false};
}

export async function listReports(directory) {
  await mkdir(directory, { recursive: true });
  const entries = (await readdir(directory)).filter(f => /^[\w.-]+\.json$/.test(f)).sort().reverse().slice(0, 100);
  const runs = [];
  for (const name of entries) {
    try {
      const value = JSON.parse(await readFile(path.join(directory, name), 'utf8'));
      if (value.schema !== 'framefuzz.evidence.v1') continue;
      runs.push({ id: name, generatedAt: value.generatedAt, source: value.source, chainId: value.chainId, totals: value.totals });
    } catch { /* invalid or in-progress evidence file */ }
  }
  return runs;
}

export async function loadReport(directory, filename) {
  if (!/^[\w.-]+\.json$/.test(filename) || path.basename(filename) !== filename) throw new Error('Invalid report filename');
  const value = JSON.parse(await readFile(path.join(directory, filename), 'utf8'));
  if (value.schema !== 'framefuzz.evidence.v1') throw new Error('Not a FrameFuzz evidence file');
  return value;
}
