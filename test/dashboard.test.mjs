import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDashboardServer } from '../src/server.mjs';
import { runMockDemo } from '../examples/mock-demo.mjs';
import { listReports } from '../src/reports.mjs';

test('complete mock demo exports honest evidence and dashboard serves selection and downloads', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'framefuzz-'));
  let server;
  try {
    const demo = await runMockDemo(directory);
    assert.match(demo.source, /MOCK.*NOT LIVE/); assert.equal(demo.totals.matched, 6);
    const reports = await listReports(directory); assert.equal(reports.length, 1);
    const evidence = JSON.parse(await readFile(demo.evidence.jsonFile, 'utf8'));
    assert.equal(evidence.submissions, 12);
    assert.equal(new Set(evidence.results.flatMap(c => c.paths.map(p => p.metadata.sender))).size, 12);
    const markdown = await readFile(demo.evidence.mdFile, 'utf8'); assert.match(markdown, /MockVerificationGasLimit/);
    const replay = JSON.parse(await readFile(demo.evidence.replayFile, 'utf8')); assert.equal(replay.cases.length, 6);
    server = createDashboardServer({ resultDir: directory, adapterFile: 'examples/mock-adapter.mjs', rulesFile: 'examples/mock-rules.json' });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const html = await (await fetch(base)).text();
    assert.match(html, /scenarioSelect/); assert.match(html, /Public expected/);
    assert.match(html, /css\/app\.css/); assert.match(html, /js\/app\.js/); assert.match(html, /Technical Briefing/);
    assert.match(html, /Present to EF/); assert.match(html, /Evidence Explorer/);
    const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1]; new Function(inline); // Syntax check, not a browser substitute.
    const css = await fetch(`${base}/css/app.css`); assert.equal(css.status, 200); assert.match(await css.text(), /--accent/);
    const js = await fetch(`${base}/js/utils.js`); assert.equal(js.status, 200); assert.match(await js.text(), /export/);
    assert.equal((await fetch(`${base}/js/not-a-real-file.js`)).status, 404);
    const config = await (await fetch(`${base}/api/config`)).json(); assert.equal(config.submitEnabled, false); assert.equal(config.scenarios.length, 3);
    const cases = await (await fetch(`${base}/api/cases?scenario=verification-gas`)).json(); assert.equal(cases.cases.length, 3);
    assert.equal((await fetch(`${base}/api/run`, { method: 'POST' })).status, 409);
    const id = encodeURIComponent(reports[0].id);
    for (const format of ['json', 'markdown', 'replay']) {
      const response = await fetch(`${base}/api/export?id=${id}&format=${format}`);
      assert.equal(response.status, 200); assert.match(response.headers.get('content-disposition'), /attachment/);
      assert.match(await response.text(), /MOCK/);
    }
    assert.equal((await fetch(`${base}/api/export?id=..%2Fpackage.json`)).status, 400);
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
