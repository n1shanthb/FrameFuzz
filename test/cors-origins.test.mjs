import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardServer } from '../src/server.mjs';
import { once } from 'node:events';

async function withServer(env, fn) {
  const previous = { ...process.env };
  Object.assign(process.env, env);
  const server = createDashboardServer({
    resultDir: 'runs',
    offlineDemo: false,
    capabilityMode: 'LIVE_READ_ONLY',
    swarmEnvironment: { ...process.env, ...env },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    server.close();
    for (const key of Object.keys(process.env)) {
      if (!(key in previous)) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

test('allows configured Vercel CORS origin on POST', async () => {
  await withServer({
    FRAMEFUZZ_ALLOW_PUBLIC_HOST: '1',
    FRAMEFUZZ_CORS_ORIGINS: 'https://frame-fuzz.vercel.app',
  }, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/readiness/probe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://frame-fuzz.vercel.app',
        host: `127.0.0.1:${port}`,
      },
      body: '{}',
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://frame-fuzz.vercel.app');
  });
});

test('rejects unknown Origin on POST', async () => {
  await withServer({
    FRAMEFUZZ_ALLOW_PUBLIC_HOST: '1',
    FRAMEFUZZ_CORS_ORIGINS: 'https://frame-fuzz.vercel.app',
  }, async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/readiness/probe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
        host: `127.0.0.1:${port}`,
      },
      body: '{}',
    });
    assert.equal(res.status, 403);
  });
});
