import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDashboardServer } from '../src/server.mjs';
const exec = promisify(execFile);

test('CLI runs full mock demo, documents flags, and returns nonzero for incomplete runs', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'framefuzz-cli-'));
  const server = createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks));
    res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x539' }));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  try {
    const help = await exec(process.execPath, ['bin/framefuzz.mjs', 'help']); assert.match(help.stdout, /--public-rpc/);
    const demo = await exec(process.execPath, ['bin/framefuzz.mjs', 'mock-demo', '--results', directory]);
    const output = JSON.parse(demo.stdout); assert.equal(output.totals.matched, 6); assert.match(output.source, /MOCK/);
    await assert.rejects(exec(process.execPath, ['bin/framefuzz.mjs', 'run', 'examples/cases', '--rpc', `http://127.0.0.1:${server.address().port}`, '--allow-chain', '1337', '--results', directory]), error => error.code === 3);
  } finally { await new Promise(r => server.close(r)); await rm(directory, { recursive: true, force: true }); }
});

test('dashboard runs selected mutation through configured adapter and rejects cross-origin POST', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'framefuzz-post-'));
  let gateway, dashboard;
  try {
    gateway = createServer(async (req, res) => {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks));
      let response = { jsonrpc: '2.0', id: body.id, result: '0x539' };
      if (body.method === 'eth_sendFrameTransaction') {
        const { model } = JSON.parse(Buffer.from(body.params[0].slice(2), 'hex').toString());
        response = model.verificationGasLimit > 100000 ? { jsonrpc: '2.0', id: body.id, error: {code:-32000,message:'MockVerificationGasLimit'} } : { jsonrpc: '2.0', id: body.id, result: `0x${'a'.repeat(64)}` };
      }
      res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(response));
    });
    await new Promise(r => gateway.listen(0, '127.0.0.1', r));
    const rpcUrl = `http://127.0.0.1:${gateway.address().port}`;
    dashboard = createDashboardServer({ resultDir: directory, rpcUrl, submit: true, allowChainId: 1337, adapterFile: 'examples/mock-adapter.mjs', rulesFile: 'examples/mock-rules.json' });
    await new Promise(r => dashboard.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${dashboard.address().port}`;
    assert.equal((await fetch(`${base}/api/run`, {method:'POST',headers:{origin:'http://evil.test'}})).status,403);
    const response = await fetch(`${base}/api/run`, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenario:'verification-gas',mutationFamily:'verification-gas'})});
    assert.equal(response.status,200); const result = await response.json(); assert.equal(result.totals.matched,3);
    const evidence = await (await fetch(`${base}/api/run?id=${encodeURIComponent(result.file)}`)).json(); assert.match(evidence.source,/MOCK/);
    assert.equal((await (await fetch(`${base}/api/config`)).json()).running,false);
    const network = await (await fetch(`${base}/api/network`)).json(); assert.equal(network.endpoints[0].state,'ready');
  } finally {
    for (const s of [dashboard,gateway]) if (s?.listening) await new Promise(r=>s.close(r));
    await rm(directory, {recursive:true,force:true});
  }
});
