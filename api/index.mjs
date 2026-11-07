/**
 * Vercel serverless entry — offline saved-demo FrameFuzz surface.
 * Local `serve` still binds 127.0.0.1 via bin/framefuzz.mjs; this path only runs when VERCEL=1.
 */
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createDashboardServer } from '../src/server.mjs';
import { prepareSavedDemo } from '../src/saved-demo.mjs';

let boot;

async function getServer() {
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

export default async function handler(req, res) {
  try {
    const server = await getServer();
    server.emit('request', req, res);
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({
        error: 'FrameFuzz Vercel boot failed',
        message: String(error?.message ?? error),
        code: 'VERCEL_BOOT_FAILED',
      }));
    }
  }
}
