/**
 * Vercel entry.
 * - If FRAMEFUZZ_BACKEND_URL is set: proxy /api/* to the OCI (or other) live Node backend.
 * - Otherwise: offline SAVED_DEMO surface only (no live chain writes).
 */
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createDashboardServer } from '../src/server.mjs';
import { prepareSavedDemo } from '../src/saved-demo.mjs';

let boot;

async function getSavedDemoServer() {
  if (!boot) {
    boot = (async () => {
      const resultDir = path.join(tmpdir(), 'framefuzz-vercel-runs');
      const demo = await prepareSavedDemo(resultDir);
      return createDashboardServer({
        resultDir,
        offlineDemo: true,
        defaultRun: demo.defaultRun,
        capabilityMode: 'SAVED_DEMO',
        submit: false,
      });
    })();
  }
  return boot;
}

function backendBase() {
  const raw = String(process.env.FRAMEFUZZ_BACKEND_URL ?? '').trim().replace(/\/$/, '');
  return raw || null;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function proxyToBackend(req, res) {
  const base = backendBase();
  const incoming = new URL(req.url || '/', `https://${req.headers.host || 'vercel.app'}`);
  const target = new URL(incoming.pathname + incoming.search, `${base}/`);
  const headers = {
    accept: req.headers.accept || 'application/json',
    'user-agent': req.headers['user-agent'] || 'framefuzz-vercel-proxy',
    'x-forwarded-host': req.headers.host || '',
    'x-forwarded-proto': 'https',
  };
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers.origin) headers.origin = req.headers.origin;

  const method = req.method || 'GET';
  const init = { method, headers, redirect: 'manual' };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await readRequestBody(req);
  }

  const upstream = await fetch(target, init);
  const body = Buffer.from(await upstream.arrayBuffer());
  res.statusCode = upstream.status;
  for (const [key, value] of upstream.headers.entries()) {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) continue;
    res.setHeader(key, value);
  }
  res.setHeader('x-framefuzz-proxy', 'oci-backend');
  res.end(body);
}

export default async function handler(req, res) {
  try {
    if (backendBase()) {
      await proxyToBackend(req, res);
      return;
    }
    const server = await getSavedDemoServer();
    server.emit('request', req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        error: 'FrameFuzz Vercel boot/proxy failed',
        message: String(error?.message ?? error),
        code: 'VERCEL_BOOT_FAILED',
      }));
    }
  }
}
