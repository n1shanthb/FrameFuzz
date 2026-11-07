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

function originalApiPath(req) {
  // Vercel rewrite stores the captured segment as ?path=...
  const url = new URL(req.url || '/', `https://${req.headers.host || 'vercel.app'}`);
  if (url.searchParams.has('path')) {
    const captured = url.searchParams.get('path') || '';
    url.searchParams.delete('path');
    const suffix = url.searchParams.toString();
    return `/api/${captured}${suffix ? `?${suffix}` : ''}`;
  }
  const forwarded = req.headers['x-forwarded-uri'] || req.headers['x-vercel-forwarded-uri'];
  if (typeof forwarded === 'string' && forwarded.startsWith('/api')) return forwarded;
  return url.pathname + url.search;
}

async function proxyToBackend(req, res) {
  const base = backendBase();
  const pathAndQuery = originalApiPath(req);
  const target = new URL(pathAndQuery, `${base}/`);
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

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: 'OCI backend unreachable from Vercel proxy',
      message: String(error?.message ?? error),
      target: String(target),
      code: 'BACKEND_UNREACHABLE',
    }));
    return;
  }
  const body = Buffer.from(await upstream.arrayBuffer());
  res.statusCode = upstream.status;
  for (const [key, value] of upstream.headers.entries()) {
    if (['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) continue;
    res.setHeader(key, value);
  }
  res.setHeader('x-framefuzz-proxy', 'oci-backend');
  res.setHeader('x-framefuzz-proxy-target', String(target));
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
