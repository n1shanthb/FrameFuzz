export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[c]));

export function tag(status) {
  const s = String(status ?? 'INCONCLUSIVE');
  const kind = /MATCH|EXPECTED_|BOUND_HOLDS|INCLUDED|ACCEPTED|ok/i.test(s) && !/UNEXPECTED|REJECT/.test(s)
    ? 'ok'
    : /UNEXPECTED|REJECT|BAD|VIOLAT|FAIL/i.test(s) ? 'bad'
    : /LIVE|INFO|ADMIT/i.test(s) ? 'info'
    : 'idle';
  return `<span class="tag ${kind}">${esc(s)}</span>`;
}

export function sourceKind(source = '') {
  if (/LIVE_RPC_SUBMISSION/.test(source)) return 'LIVE';
  if (/PREVIEW/.test(source)) return 'PREVIEW';
  if (/MOCK|SYNTHETIC/.test(source)) return 'MOCK';
  return 'OTHER';
}

export function sourcePill(source) {
  const kind = sourceKind(source);
  const cls = kind === 'LIVE' ? 'ok' : kind === 'PREVIEW' ? 'neutral' : kind === 'MOCK' ? 'idle' : 'info';
  return `<span class="pill ${cls}">${esc(kind)}</span>`;
}

export function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch { return String(iso); }
}

export function shortHash(h) {
  if (!h || typeof h !== 'string') return '—';
  return h.length > 18 ? `${h.slice(0, 10)}…${h.slice(-6)}` : h;
}

export function pathOf(caseRow, which) {
  const paths = caseRow?.paths ?? [];
  if (which === 'public') return paths.find((p) => ['public', 'canonical'].includes(p.id));
  return paths.find((p) => p.id === 'alt' || p.id === 'alternative');
}

export function countInfra(report) {
  return (report?.results ?? []).flatMap((c) => c.paths ?? [])
    .filter((p) => p.comparison?.verdict === 'INFRASTRUCTURE_FAILURE' || p.observed?.errorClass === 'gateway_infrastructure').length;
}

export function copyText(text) {
  if (!text) return Promise.resolve(false);
  return navigator.clipboard?.writeText(String(text)).then(() => true).catch(() => false);
}

export function icon(name) {
  const paths = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    campaigns: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3-4 3 2 4-6"/>',
    evidence: '<path d="M8 3h6l4 4v14H8z"/><path d="M14 3v4h4"/><path d="M11 13h6"/><path d="M11 17h4"/>',
    arkiv: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M18.4 5.6l-2.1 2.1"/><path d="M7.7 16.3l-2.1 2.1"/>',
    swarm: '<circle cx="6" cy="8" r="2.2"/><circle cx="18" cy="8" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M8 9.2 10.5 15"/><path d="M16 9.2 13.5 15"/><path d="M8.2 8h7.6"/>',
    briefing: '<path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h6"/>',
    copy: '<rect x="8" y="8" width="10" height="10" rx="2"/><path d="M6 16V6a2 2 0 0 1 2-2h10"/>',
    play: '<polygon points="8,5 19,12 8,19"/>',
    arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? ''}</svg>`;
}
