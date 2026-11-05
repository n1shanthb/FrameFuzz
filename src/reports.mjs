import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const slug = x => String(x).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);

export function toMarkdown(output) {
  const lines = [
    '# FrameFuzz admission evidence', '',
    `- Source: **${output.source}**`,
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
  lines.push('', '## Details', '');
  for (const c of output.results) {
    lines.push(`### ${c.id}`, '', c.description, '');
    for (const p of c.paths) {
      lines.push(`- **${p.id}:** ${p.comparison.reason}`);
      if (p.observed.hash) lines.push(`  - Transaction: \`${p.observed.hash}\``);
      if (p.observed.message) lines.push(`  - RPC response: ${p.observed.message.replaceAll('\n', ' ').slice(0, 500)}`);
      if (p.receipt) lines.push(`  - Receipt: ${p.receipt.state}, block ${p.receipt.blockNumber ?? 'unconfirmed'}`);
    }
    if (c.sourceFile) lines.push(`- Reproduction fixture: \`${c.sourceFile}\``);
    lines.push('');
  }
  return lines.join('\n');
}

export async function saveReport(output, directory) {
  await mkdir(directory, { recursive: true });
  const base = `${new Date().toISOString().replace(/[:.]/g, '-')}-${slug(output.source)}`;
  const jsonFile = path.resolve(directory, `${base}.json`);
  const mdFile = path.resolve(directory, `${base}.md`);
  await Promise.all([
    writeFile(jsonFile, JSON.stringify(output, null, 2) + '\n'),
    writeFile(mdFile, toMarkdown(output) + '\n'),
  ]);
  return { jsonFile, mdFile };
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
