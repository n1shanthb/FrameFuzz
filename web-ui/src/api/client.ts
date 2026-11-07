async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}

const timeout = (ms = 20000) => AbortSignal.timeout(ms);

export const api = {
  config: () => fetch('/api/config', { signal: timeout() }).then(parse),
  runs: () => fetch('/api/runs', { signal: timeout() }).then(parse),
  run: (id: string) => fetch(`/api/run?id=${encodeURIComponent(id)}`, { signal: timeout() }).then(parse),
  network: () => fetch('/api/network', { signal: timeout() }).then(parse),
  readiness: () => fetch('/api/readiness', { signal: timeout() }).then(parse),
  readinessProbe: () => fetch('/api/readiness/probe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: timeout(30000) }).then(parse),
  community: (params: URLSearchParams) => fetch(`/api/community?${params}`, { signal: timeout(15000) }).then(parse),
  communitySaved: (params: URLSearchParams) => fetch(`/api/community/saved?${params}`, { signal: timeout() }).then(parse),
  communityCase: (key: string) => fetch(`/api/community/case?key=${encodeURIComponent(key)}`, { signal: timeout(15000) }).then(parse),
  communityImport: (key: string) => fetch('/api/community/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }), signal: timeout(15000) }).then(parse),
  cases: (scenario: string) => fetch(`/api/cases?scenario=${encodeURIComponent(scenario)}`, { signal: timeout() }).then(parse),
  mutate: (body: unknown) => fetch('/api/mutate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(60000) }).then(parse),
  exportUrl: (id: string, format: string) => `/api/export?id=${encodeURIComponent(id)}&format=${format}`,
  swarmConfig: () => fetch('/api/swarm/config', { signal: timeout() }).then(parse),
  swarmRecent: () => fetch('/api/swarm/recent', { signal: timeout() }).then(parse),
  swarmTranscript: (id: string) => fetch(`/api/swarm/transcript?id=${encodeURIComponent(id)}`, { signal: timeout() }).then(parse),
  playground: {
    config: () => fetch('/api/playground/config', { signal: timeout() }).then(parse),
    budget: () => fetch('/api/playground/budget', { signal: timeout() }).then(parse),
    supportedScenario: () => fetch('/api/playground/supported-scenario', { signal: timeout() }).then(parse),
    uniswapSource: () => fetch('/api/playground/uniswap-source', { signal: timeout() }).then(parse),
    uniswapCaptured: () => fetch('/api/playground/uniswap-captured', { signal: timeout() }).then(parse),
    analyze: (body: unknown) => fetch('/api/playground/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    admissionReadiness: (q: URLSearchParams) => fetch(`/api/playground/admission-readiness?${q}`, { signal: timeout(30000) }).then(parse),
    livePrepare: (body: unknown) => fetch('/api/playground/live-prepare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    uniswapPrepare: (body: unknown) => fetch('/api/playground/uniswap-prepare', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(30000) }).then(parse),
    liveRun: (body: unknown) => fetch('/api/playground/live-run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(120000) }).then(parse),
    saveRegression: (body: unknown) => fetch('/api/playground/save-regression', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout() }).then(parse),
    start: (body: unknown) => fetch('/api/playground/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout() }).then(parse),
    job: (id: string) => fetch(`/api/playground/job?id=${encodeURIComponent(id)}`, { signal: timeout() }).then(parse),
    cancel: (id: string) => fetch('/api/playground/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }), signal: timeout() }).then(parse),
    arkivImport: (body: unknown) => fetch('/api/playground/arkiv/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: timeout(15000) }).then(parse),
    exportUrl: (id: string, format: string) => `/api/playground/export?id=${encodeURIComponent(id)}&format=${format}`,
  },
};
