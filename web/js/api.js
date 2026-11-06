async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}

export const api = {
  config: () => fetch('/api/config').then(parse),
  runs: () => fetch('/api/runs').then(parse),
  run: (id) => fetch(`/api/run?id=${encodeURIComponent(id)}`).then(parse),
  network: () => fetch('/api/network').then(parse),
  cases: (scenario) => fetch(`/api/cases?scenario=${encodeURIComponent(scenario || 'fixtures')}`).then(parse),
  mutate: (body) => fetch('/api/mutate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parse),
  runSuite: (body) => fetch('/api/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parse),
  community: (params) => fetch(`/api/community?${params}`).then(parse),
  communityCase: (key) => fetch(`/api/community/case?key=${encodeURIComponent(key)}`).then(parse),
  communityImport: (key) => fetch('/api/community/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key }),
  }).then(parse),
  exportUrl: (id, format) => `/api/export?id=${encodeURIComponent(id)}&format=${format}`,
  swarmConfig: () => fetch('/api/swarm/config').then(parse),
  swarmRecent: () => fetch('/api/swarm/recent').then(parse),
  swarmRun: (body) => fetch('/api/swarm/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(parse),
  swarmTranscript: (id) => fetch(`/api/swarm/transcript?id=${encodeURIComponent(id)}`).then(parse),
  swarmExport: (id,format='json') => `/api/swarm/export?id=${encodeURIComponent(id)}&format=${format}`,
};
