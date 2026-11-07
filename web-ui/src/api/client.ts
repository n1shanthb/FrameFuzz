async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}

const timeout = (ms = 20000) => AbortSignal.timeout(ms);

/** Empty = same-origin /api (local or Vercel proxy). Set VITE_API_BASE to the OCI LIVE host for production. */
const API_BASE = String(import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export const api = {
  config: () => fetch(apiUrl('/api/config'), { signal: timeout() }).then(parse),
  runs: () => fetch(apiUrl('/api/runs'), { signal: timeout() }).then(parse),
  run: (id: string) => fetch(apiUrl(`/api/run?id=${encodeURIComponent(id)}`), { signal: timeout() }).then(parse),
  network: () => fetch(apiUrl('/api/network'), { signal: timeout() }).then(parse),
  readiness: () => fetch(apiUrl('/api/readiness'), { signal: timeout() }).then(parse),
  readinessProbe: () => fetch(apiUrl('/api/readiness/probe'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: timeout(30000) }).then(parse),
  community: (params: URLSearchParams) => fetch(apiUrl(`/api/community?${params}`), { signal: timeout(15000) }).then(parse),
  communitySaved: (params: URLSearchParams) => fetch(apiUrl(`/api/community/saved?${params}`), { signal: timeout() }).then(parse),
  communityCase: (key: string) => fetch(apiUrl(`/api/community/case?key=${encodeURIComponent(key)}`), { signal: timeout(15000) }).then(parse),
  communityImport: (key: string) => fetch(apiUrl('/api/community/import'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }), signal: timeout(15000) }).then(parse),
  cases: (scenario: string) => fetch(apiUrl(`/api/cases?scenario=${encodeURIComponent(scenario)}`), { signal: timeout() }).then(parse),
  mutate: (body: unknown) => fetch(apiUrl('/api/mutate'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(60000) }).then(parse),
  exportUrl: (id: string, format: string) => apiUrl(`/api/export?id=${encodeURIComponent(id)}&format=${format}`),
  swarmConfig: () => fetch(apiUrl('/api/swarm/config'), { signal: timeout() }).then(parse),
  swarmRecent: () => fetch(apiUrl('/api/swarm/recent'), { signal: timeout() }).then(parse),
  swarmTranscript: (id: string) => fetch(apiUrl(`/api/swarm/transcript?id=${encodeURIComponent(id)}`), { signal: timeout() }).then(parse),
  playground: {
    config: () => fetch(apiUrl('/api/playground/config'), { signal: timeout() }).then(parse),
    budget: () => fetch(apiUrl('/api/playground/budget'), { signal: timeout() }).then(parse),
    supportedScenario: () => fetch(apiUrl('/api/playground/supported-scenario'), { signal: timeout() }).then(parse),
    uniswapSource: () => fetch(apiUrl('/api/playground/uniswap-source'), { signal: timeout() }).then(parse),
    uniswapCaptured: () => fetch(apiUrl('/api/playground/uniswap-captured'), { signal: timeout() }).then(parse),
    analyze: (body: unknown) => fetch(apiUrl('/api/playground/analyze'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    admissionReadiness: (q: URLSearchParams) => fetch(apiUrl(`/api/playground/admission-readiness?${q}`), { signal: timeout(30000) }).then(parse),
    livePrepare: (body: unknown) => fetch(apiUrl('/api/playground/live-prepare'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    uniswapPrepare: (body: unknown) => fetch(apiUrl('/api/playground/uniswap-prepare'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    liveRun: (body: unknown) => fetch(apiUrl('/api/playground/live-run'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(120000) }).then(parse),
    saveRegression: (body: unknown) => fetch(apiUrl('/api/playground/save-regression'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout() }).then(parse),
    start: (body: unknown) => fetch(apiUrl('/api/playground/start'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout() }).then(parse),
    job: (id: string) => fetch(apiUrl(`/api/playground/job?id=${encodeURIComponent(id)}`), { signal: timeout() }).then(parse),
    cancel: (id: string) => fetch(apiUrl('/api/playground/cancel'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }), signal: timeout() }).then(parse),
    arkivImport: (body: unknown) => fetch(apiUrl('/api/playground/arkiv/import'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(15000) }).then(parse),
    exportUrl: (id: string, format: string) => apiUrl(`/api/playground/export?id=${encodeURIComponent(id)}&format=${format}`),
  },
};
