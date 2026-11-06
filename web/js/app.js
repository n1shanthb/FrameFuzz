import { api } from './api.js';
import { BRIEFING, SLIDES, FAQ } from './briefing.js';
import {
  esc, tag, sourceKind, sourcePill, fmtTime, shortHash, pathOf, countInfra, copyText, icon,
} from './utils.js';

const state = {
  page: 'overview',
  config: null,
  runs: [],
  active: null,
  runId: null,
  selectedCase: 0,
  community: null,
  selectedCommunity: null,
  status: 'Idle',
  gatewayStatus: 'Gateway status has not been checked.',
  presenting: false,
  slideIndex: 0,
  evidenceFilter: 'all',
  swarmEnabled: false,
};

const $ = (id) => document.getElementById(id);

function modePill() {
  const c = state.config;
  if (!c) return '<span class="pill"><span class="dot"></span>Loading…</span>';
  if (c.offlineDemo) return '<span class="pill warn"><span class="dot"></span>SAVED EVIDENCE · READ ONLY</span>';
  if (c.submitEnabled) return `<span class="pill live"><span class="dot"></span>AUTHORIZED LIVE · chain ${esc(c.allowChainId)}</span>`;
  return '<span class="pill"><span class="dot"></span>READ ONLY</span>';
}

function setStatus(msg) {
  state.status = msg;
  const el = $('executionStatus');
  if (el) el.textContent = msg;
  const top = $('engineStatus');
  if (top) top.textContent = msg;
}

function navigate(page) {
  if (state.presenting) exitPresent();
  state.page = page;
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function findRunByHint(hint) {
  return state.runs.find((r) => r.id.includes(hint) || (r.source || '').includes(hint));
}

async function loadRun(id) {
  if (!id) return;
  try {
    const data = await api.run(id);
    state.active = data;
    state.runId = id;
    state.selectedCase = 0;
    setStatus(`Viewing saved evidence · ${sourceKind(data.source)} · no transaction sent by selection.`);
    render();
  } catch (e) {
    setStatus(`Could not load run: ${e.message}`);
  }
}

function kpiFromRuns() {
  const live = state.runs.filter((r) => sourceKind(r.source) === 'LIVE');
  const preview = state.runs.filter((r) => sourceKind(r.source) === 'PREVIEW');
  const mock = state.runs.filter((r) => sourceKind(r.source) === 'MOCK');
  let matched = 0; let unexpected = 0; let cases = 0;
  for (const r of state.runs) {
    matched += r.totals?.matched ?? 0;
    unexpected += r.totals?.unexpected ?? 0;
    cases += r.totals?.cases ?? 0;
  }
  return { live: live.length, preview: preview.length, mock: mock.length, matched, unexpected, cases };
}

function renderShellChrome() {
  $('modePill').innerHTML = modePill();
  const c = state.config;
  $('networkPill').textContent = c?.offlineDemo
    ? 'Offline saved-evidence mode'
    : c?.submitEnabled
      ? `Chain ${c.allowChainId} · submission enabled`
      : 'No live submission';
  $('demoMode').textContent = c?.offlineDemo
    ? 'Saved-evidence mode. Historical LIVE captures and PREVIEW only — no fresh network execution.'
    : c?.submitEnabled
      ? `Authorized live mode on chain ${c.allowChainId}. Admission hash ≠ inclusion.`
      : 'Read-only dashboard. Start with --rpc, --allow-chain and --submit to enable live submissions.';
  $('demoMode').className = c?.offlineDemo ? 'alert' : c?.submitEnabled ? 'alert ok' : 'alert info';
}

function renderOverview() {
  const k = kpiFromRuns();
  const g = BRIEFING.gasCampaign;
  const u = BRIEFING.uniswap;
  const matrix = u.rows.map((row) => {
    const pubCls = row.public.admission === 'accepted' ? 'cell-ok' : 'cell-bad';
    const altCls = row.alt.admission === 'accepted' ? 'cell-ok' : 'cell-bad';
    return `
      <div class="scenario">${esc(row.label)}<div class="tiny mono">${esc(row.id)}</div>
        <button class="linkish" data-open-hint="3a838bca" data-case="${esc(row.id)}">Inspect capture</button>
      </div>
      <div class="${pubCls}">${esc(row.public.admission.toUpperCase())}
        <div class="tiny">${esc(row.public.receipt)}</div>
      </div>
      <div class="${altCls}">${esc(row.alt.admission.toUpperCase())}
        <div class="tiny">${esc(row.alt.receipt)}${row.alt.hash ? ` · ${shortHash(row.alt.hash)}` : ''}</div>
      </div>`;
  }).join('');

  const recent = state.runs.slice(0, 8).map((r) => `
    <tr data-run="${esc(r.id)}">
      <td><strong>${esc(r.id.replace(/\.json$/, '').slice(0, 42))}</strong>
        <div class="tiny">${esc(fmtTime(r.generatedAt))}</div></td>
      <td>${sourcePill(r.source)}</td>
      <td>${esc(r.totals?.matched ?? '—')}</td>
      <td>${esc(r.totals?.unexpected ?? '—')}</td>
      <td>${esc(r.totals?.inconclusive ?? '—')}</td>
      <td><button class="btn btn-ghost btn-sm" data-run="${esc(r.id)}">Inspect</button></td>
    </tr>`).join('') || '<tr><td colspan="6" class="empty">No saved evidence in the results directory.</td></tr>';

  return `
    <section class="hero">
      <div class="eyebrow">Frame transaction security testing</div>
      <h1>Know why a transaction fails before it reaches a block.</h1>
      <p>Generate deterministic frame-transaction variants, compare admission policies, inspect receipts and replay verified regression cases.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-nav="evidence">${icon('evidence')} Explore Real Evidence</button>
        <button class="btn btn-secondary" data-nav="briefing">${icon('briefing')} Technical Briefing</button>
      </div>
    </section>

    <div class="grid-4" style="margin-top:18px">
      <div class="metric"><div class="metric-label">Gas admission matches</div><div class="metric-value" style="color:var(--success)">${g.matchedDecisions}/${g.admissionChecks}</div><div class="metric-note">Historical LIVE · ${g.variants} variants</div></div>
      <div class="metric"><div class="metric-label">Successful inclusions</div><div class="metric-value">${g.includedSuccess}</div><div class="metric-note">Gas campaign receipts · status 0x1</div></div>
      <div class="metric"><div class="metric-label">Automated tests</div><div class="metric-value">${BRIEFING.testsAtCheckpoint}</div><div class="metric-note">Latest checkpoint · not a live proof</div></div>
      <div class="metric"><div class="metric-label">Library runs loaded</div><div class="metric-value">${k.live}<span class="muted" style="font-size:16px"> LIVE</span></div><div class="metric-note">${k.preview} preview · ${k.mock} mock</div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-head">
        <div>
          <h2>Public vs alternative mempool</h2>
          <p class="summary">Historical Uniswap paymaster observations · admission and inclusion are distinct · captured ${fmtTime(u.capturedAt)}</p>
        </div>
        <span class="pill ok">HISTORICAL LIVE CAPTURE</span>
      </div>
      <div class="matrix">
        <div class="head">Scenario</div><div class="head">Public mempool</div><div class="head">Alternative mempool</div>
        ${matrix}
      </div>
      <p class="muted" style="margin:12px 0 0;font-size:12px">Staked alt inclusion hash: <code class="mono">${u.rows[2].alt.hash}</code>. No swap or active liquidity trade is claimed.</p>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="card-head"><div><h2>Recent investigations</h2><p class="summary">From the local evidence library served by this dashboard</p></div></div>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Run</th><th>Source</th><th>Matched</th><th>Unexpected</th><th>Inconclusive</th><th></th></tr></thead>
          <tbody>${recent}</tbody>
        </table>
      </div>
    </div>`;
}

function boundaryViz() {
  const c = BRIEFING.gasCampaign.components;
  return `
    <div class="boundary">
      <div class="boundary-row"><span>Sender VERIFY</span><strong>${c.sender.toLocaleString()}</strong></div>
      <div class="boundary-row"><span>Payer VERIFY (boundary)</span><strong>${c.payer.toLocaleString()}</strong></div>
      <div class="boundary-row"><span>Signature verification</span><strong>${c.signature.toLocaleString()}</strong></div>
      <div class="boundary-row boundary-total"><span>Observed total cap</span><strong>${c.cap.toLocaleString()}</strong></div>
      <div class="boundary-results">
        ${BRIEFING.gasCampaign.samples.map((s) => `<span class="tag ${s.outcome === 'accepted' ? 'ok' : 'bad'}">${s.value.toLocaleString()} → ${s.outcome}</span>`).join('')}
      </div>
      <p class="muted" style="margin:0;font-size:11px">Implementation-profile observations for the tested workshop client — not universal guarantees.</p>
    </div>`;
}

function caseDetailHtml(report, c) {
  if (!c) return '<div class="empty">Choose a test case</div>';
  const paths = (c.paths ?? []).map((p) => {
    const returned = p.observed?.hash;
    const computed = p.metadata?.transaction?.hash;
    const hashLine = returned
      ? `Returned admission hash: ${returned}`
      : computed
        ? `Computed-only hash (not admitted): ${computed}`
        : 'No hash';
    return `
      <div class="card" style="padding:14px;margin-bottom:10px;box-shadow:none">
        <div class="row" style="justify-content:space-between">
          <strong>${esc(p.id)}</strong>
          ${tag(p.comparison?.verdict)}
        </div>
        <div class="kv" style="margin-top:8px">
          <div class="kv-row"><span>Expected</span><b>${esc(p.expected ?? 'unspecified')}</b></div>
          <div class="kv-row"><span>Observed</span><b>${esc(p.observed?.status ?? 'unknown')}</b></div>
          <div class="kv-row"><span>Receipt</span><b>${esc(p.receipt?.state ?? 'not_checked')}</b></div>
          <div class="kv-row"><span>Method</span><b class="mono">${esc(p.method ?? '—')}</b></div>
          <div class="kv-row"><span>Hash</span><b class="mono">${esc(hashLine)}</b></div>
          <div class="kv-row"><span>Diagnostic</span><b>${esc(p.observed?.message ?? p.comparison?.reason ?? '—')}</b></div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="row" style="justify-content:space-between;margin-bottom:8px">
      <div>
        <h3 style="margin:0">${esc(c.id)}</h3>
        <p class="summary">${esc(c.description || c.category || '')}</p>
      </div>
      ${tag(c.verdict)}
    </div>
    ${c.mutation?.parameter ? `<p class="mono muted">Semantic input: ${esc(JSON.stringify(c.mutation.parameter))}</p>` : ''}
    ${paths}
    <details><summary class="muted">Mutation, rules, metadata & raw evidence</summary>
      <pre class="code-box">${esc(JSON.stringify({
    paths: c.paths, mutation: c.mutation, ruleProvenance: c.ruleProvenance, reproduction: c.reproduction,
    communityOrigin: report.communityOrigin, network: report.network, uniswap: report.uniswap,
  }, null, 2))}</pre>
    </details>
    <p class="mono muted" style="margin-top:10px">${esc(c.reproduction?.cli || `Case ${c.id} · chain ${report.chainId}`)}</p>`;
}

function renderCampaigns() {
  const c = state.config;
  const enabled = Boolean(c?.submitEnabled);
  const report = state.active;
  const rows = (report?.results ?? []).map((row, i) => {
    const pub = pathOf(row, 'public');
    const alt = pathOf(row, 'alt');
    return `<tr data-case="${i}" class="${i === state.selectedCase ? 'selected' : ''}">
      <td><strong>${esc(row.id)}</strong>
        <div class="tiny">${esc(row.category || '')}</div>
        ${row.mutation?.parameter ? `<div class="tiny mono">${esc(JSON.stringify(row.mutation.parameter))}</div>` : ''}
      </td>
      <td>${esc(pub?.oracle?.ruleId || pub?.expectedRule || '—')}</td>
      <td>${esc(pub?.expected ?? '—')} / ${esc(pub?.observed?.status ?? '—')}<div>${tag(pub?.comparison?.verdict)}</div><div class="tiny">${esc(pub?.receipt?.state ?? 'not_checked')}</div></td>
      <td>${esc(alt?.expected ?? '—')} / ${esc(alt?.observed?.status ?? '—')}<div>${tag(alt?.comparison?.verdict)}</div><div class="tiny">${esc(alt?.receipt?.state ?? 'not_checked')}</div></td>
      <td>${tag(row.verdict)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">No cases. Preview mutations or open a saved run.</td></tr>';

  const selected = report?.results?.[state.selectedCase];
  const scenarios = (c?.scenarios ?? [{ id: 'fixtures', label: 'Signed case fixtures' }])
    .map((s) => `<option value="${esc(s.id)}">${esc(s.label)}</option>`).join('');

  return `
    <div class="card" id="tests">
      <div class="card-head">
        <div>
          <h2>Test campaigns</h2>
          <p class="summary">Semantic mutations · independent signatures · expected vs observed admission</p>
        </div>
        <span class="pill ${enabled ? 'live' : ''}"><span class="dot"></span>${enabled ? 'Live authorized' : 'Preview only'}</span>
      </div>
      <div class="controls">
        <label class="field">Scenario<select id="scenarioSelect">${scenarios}</select></label>
        <label class="field">Mutation<select id="mutationSelect">
          <option value="all">All cases</option>
          <option value="baseline">Baseline only</option>
          <option value="verification-gas">Verification gas</option>
        </select></label>
        <button class="btn btn-secondary" id="checkNetwork" ${c?.offlineDemo ? 'disabled' : ''}>Check gateways</button>
        <button class="btn btn-primary" id="runButton" ${enabled ? '' : 'disabled'}>Run tests</button>
      </div>
      <p class="muted" id="runHelp" style="margin-top:10px">${esc(c?.offlineDemo
    ? 'Saved-evidence mode. Live tests and network checks are disabled.'
    : enabled
      ? `Ready to run signed fixtures from ${c.casesLocation} on chain ${c.allowChainId}.`
      : 'Read-only mode. Configure --rpc, --allow-chain and --submit for live submissions.')}</p>
      <div class="alert" style="margin-top:12px">A submitted transaction hash proves an admission response only. Inclusion and execution are reported separately.</div>

      <details open style="margin-top:16px">
        <summary style="font-weight:600;cursor:pointer">Generate semantic mutations</summary>
        <div class="controls" style="margin-top:12px">
          <label class="field">Suite<select id="mutationSuite">
            <option value="verification-gas">Verification gas</option>
            <option value="uniswap-storage">Uniswap storage / stake</option>
          </select></label>
          <label class="field">Seed<input id="mutationSeed" type="number" min="0" max="4294967295" value="42"></label>
          <label class="field">Variants<input id="mutationCount" type="number" min="1" max="1000" value="7"></label>
          <button class="btn btn-secondary" id="previewMutation">Preview mutations</button>
          <button class="btn btn-primary" id="submitMutation" ${enabled ? '' : 'disabled'}>Submit generated tests</button>
        </div>
        <p class="muted" style="margin-top:8px">Preview is offline. Authorized live batches are limited to seven variants; each path gets a fresh signed transaction.</p>
      </details>
      <p class="muted" id="gatewayStatus" style="margin-top:10px">${esc(state.gatewayStatus)}</p>
      <p class="muted" id="executionStatus">${esc(state.status)}</p>
    </div>

    <div class="grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-head"><div><h2>Verification gas profile</h2><p class="summary">Observed workshop components</p></div></div>
        ${boundaryViz()}
      </div>
      <div class="card">
        <div class="card-head">
          <div><h2>Evidence library</h2><p class="summary">Select a saved run</p></div>
          <select id="runSelect" style="max-width:260px;padding:8px 10px;border-radius:8px;border:1px solid var(--border-strong);background:#fff">
            ${state.runs.map((r) => `<option value="${esc(r.id)}" ${r.id === state.runId ? 'selected' : ''}>${esc(fmtTime(r.generatedAt))} · ${esc(sourceKind(r.source))}</option>`).join('') || '<option>No evidence files</option>'}
          </select>
        </div>
        ${report ? `
          <div class="row" style="margin-bottom:10px">
            ${sourcePill(report.source)}
            <span class="pill">${esc(report.totals?.cases ?? 0)} cases</span>
            <span class="pill ok">${esc(report.totals?.matched ?? 0)} matched</span>
            <span class="pill bad">${esc(report.totals?.unexpected ?? 0)} unexpected</span>
          </div>
          <p class="muted" style="font-size:12px">Captured ${esc(fmtTime(report.generatedAt))} · ${esc(report.source)}</p>
          <div class="row" style="margin-top:12px">
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'json')}">JSON</a>
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'markdown')}">Markdown</a>
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'replay')}">Replay</a>
          </div>` : '<div class="empty">No run selected</div>'}
      </div>
    </div>

    <div class="split-detail" style="margin-top:16px">
      <div class="card" id="cases" style="padding:0;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--border)">
          <h2 style="margin:0">Campaign results</h2>
          <p class="summary">Public expected / actual · Alternative expected / actual</p>
        </div>
        <div class="table-wrap" style="border:0;border-radius:0">
          <table class="data">
            <thead><tr><th>Semantic mutation</th><th>Rule</th><th>Public</th><th>Alternative</th><th>Result</th></tr></thead>
            <tbody id="caseRows">${rows}</tbody>
          </table>
        </div>
      </div>
      <div class="card" id="detail">
        <div class="card-head"><h2 style="margin:0">Run detail</h2><span class="tag info" id="sourceBadge">${esc(sourceKind(report?.source))}</span></div>
        ${caseDetailHtml(report, selected)}
      </div>
    </div>`;
}

function filteredResults(report) {
  const f = state.evidenceFilter;
  return (report?.results ?? []).filter((c) => {
    if (f === 'all') return true;
    if (f === 'accepted') return (c.paths ?? []).some((p) => p.observed?.status === 'accepted');
    if (f === 'rejected') return (c.paths ?? []).some((p) => p.observed?.status === 'rejected');
    if (f === 'included') return (c.paths ?? []).some((p) => p.receipt?.state === 'included_success' || p.receipt?.state === 'INCLUDED_SUCCESS' || /included_success/i.test(p.receipt?.state ?? ''));
    if (f === 'inconclusive') return c.verdict === 'INCONCLUSIVE' || (c.paths ?? []).some((p) => p.comparison?.verdict === 'INCONCLUSIVE');
    if (f === 'infra') return (c.paths ?? []).some((p) => p.comparison?.verdict === 'INFRASTRUCTURE_FAILURE');
    return true;
  });
}

function renderEvidence() {
  const report = state.active;
  const list = state.runs.map((r) => `
    <button class="nav-item ${r.id === state.runId ? 'active' : ''}" data-run="${esc(r.id)}" style="margin-bottom:4px">
      <div style="min-width:0">
        <div style="font-weight:600;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.id.replace(/\.json$/, '').slice(0, 36))}</div>
        <div class="tiny">${esc(fmtTime(r.generatedAt))} · ${esc(sourceKind(r.source))}</div>
      </div>
    </button>`).join('') || '<div class="empty">No evidence</div>';

  const chips = ['all', 'accepted', 'rejected', 'included', 'inconclusive', 'infra']
    .map((f) => `<button class="chip ${state.evidenceFilter === f ? 'active' : ''}" data-filter="${f}">${f}</button>`).join('');

  const results = filteredResults(report);
  const selected = report?.results?.[state.selectedCase];
  const stages = (selected?.paths ?? []).map((p) => {
    const admitted = p.observed?.status === 'accepted';
    const included = /included_success/i.test(p.receipt?.state ?? '');
    return `
      <div class="timeline-step">
        <div class="timeline-rail"><div class="timeline-dot ${admitted ? 'ok' : p.observed?.status === 'rejected' ? 'bad' : 'idle'}"></div></div>
        <div>
          <strong>${esc(p.id)} path</strong>
          <div class="tiny">Admission: ${esc(p.observed?.status ?? 'unknown')} · Inclusion: ${esc(p.receipt?.state ?? 'not_checked')}</div>
          <div class="tiny muted">ADMITTED ≠ INCLUDED ≠ action success</div>
        </div>
      </div>
      <div class="timeline-step">
        <div class="timeline-rail"><div class="timeline-dot ${included ? 'ok' : 'idle'}"></div></div>
        <div>
          <strong>Receipt stage</strong>
          <div class="tiny">${included ? 'Included successfully' : 'Not included / not checked'}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="split-detail">
      <div class="card" style="padding:14px">
        <h2 style="margin:0 0 10px">Evidence library</h2>
        <div class="filter-bar" style="margin-bottom:12px">${chips}</div>
        <div style="max-height:70vh;overflow:auto">${list}</div>
      </div>
      <div class="stack">
        <div class="card">
          <div class="card-head">
            <div>
              <h2>Evidence explorer</h2>
              <p class="summary">${report ? `${esc(report.source)} · captured ${esc(fmtTime(report.generatedAt))}` : 'Select a campaign'}</p>
            </div>
            ${report ? sourcePill(report.source) : ''}
          </div>
          ${report && /LIVE/.test(report.source) ? '<div class="alert info">HISTORICAL LIVE CAPTURE — selecting this report does not rerun RPC.</div>' : ''}
          ${report && /PREVIEW/.test(report.source) ? '<div class="alert">PREVIEW — unsigned models and expectations only. No RPC, signing or broadcast.</div>' : ''}
          <div class="table-wrap" style="margin-top:12px">
            <table class="data">
              <thead><tr><th>Case</th><th>Verdict</th><th>Public</th><th>Alt</th></tr></thead>
              <tbody>
                ${results.map((c) => {
    const idx = report.results.indexOf(c);
    const pub = pathOf(c, 'public'); const alt = pathOf(c, 'alt');
    return `<tr data-case="${idx}" class="${idx === state.selectedCase ? 'selected' : ''}">
                    <td><strong>${esc(c.id)}</strong></td>
                    <td>${tag(c.verdict)}</td>
                    <td>${esc(pub?.observed?.status ?? '—')}</td>
                    <td>${esc(alt?.observed?.status ?? '—')}</td>
                  </tr>`;
  }).join('') || '<tr><td colspan="4" class="empty">No matching cases</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-top:0">Event timeline</h3>
          <div class="timeline">${stages || '<div class="empty">Select a case</div>'}</div>
          ${selected ? caseDetailHtml(report, selected) : ''}
          ${state.runId ? `<div class="row" style="margin-top:12px">
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'json')}">Download JSON</a>
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'markdown')}">Markdown</a>
            <a class="btn btn-secondary btn-sm" href="${api.exportUrl(state.runId, 'replay')}">Replay</a>
          </div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderArkiv() {
  const offline = state.config?.offlineDemo;
  const cases = state.community?.cases ?? [];
  const list = cases.map((c) => `
    <button class="btn btn-secondary" style="display:block;width:100%;text-align:left;white-space:normal;margin-bottom:8px" data-community-key="${esc(c.key)}">
      <strong>${esc(c.record.suite)} / ${esc(c.record.ruleId)}</strong>
      <div class="tiny mono">${esc(c.key)}</div>
      <div class="tiny">publisher ${esc(c.record.publisher)} · owner ${esc(c.owner)} · expires ${esc(c.expiresAtBlock)} · original ${esc(c.record.evidence.classification)}</div>
    </button>`).join('') || '<div class="empty">No active cases queried yet</div>';

  return `
    <div class="card">
      <div class="card-head">
        <div>
          <h2>Arkiv registry</h2>
          <p class="summary">Wallet-owned semantic fixtures on Rabdi · Discover → Verify → Import → Replay Preview</p>
        </div>
        <span class="pill info">chain 7794095</span>
      </div>
      <div class="alert info">${esc(BRIEFING.arkiv.note)}</div>
      ${offline ? '<div class="alert" style="margin-top:10px">Offline saved-evidence mode: live Arkiv discovery/import is disabled. Open <strong>saved-arkiv-import-preview</strong> in Evidence Explorer for the previously imported fixture.</div>' : ''}
      <div class="controls" style="margin-top:14px">
        <label class="field">Suite<select id="communitySuite"><option value="">All suites</option><option>verification-gas</option><option>uniswap-storage</option></select></label>
        <label class="field">Rule ID<input id="communityRule" placeholder="MAX_VERIFY_GAS"></label>
        <label class="field">Implementation<input id="communityVersion" placeholder="Optional version"></label>
        <label class="field">Owner<input id="communityOwner" placeholder="Optional 0x wallet"></label>
        <button class="btn btn-secondary" id="queryCommunity" ${offline ? 'disabled' : ''}>Query Arkiv</button>
      </div>
      <p class="muted" id="communityStatus" style="margin-top:10px">${offline ? 'Live Arkiv disabled in offline mode.' : 'Not queried. RPC: https://rpc.rabdi.db-chain.testnet.arkiv.network'}</p>
      <div class="pipeline" style="margin:16px 0">
        <div class="node">Discover</div><div class="arrow">→</div>
        <div class="node">Verify integrity</div><div class="arrow">→</div>
        <div class="node">Import</div><div class="arrow">→</div>
        <div class="node">Replay PREVIEW</div>
      </div>
      <div class="grid-2">
        <div>
          <h3>Active fixtures</h3>
          <div id="communityList">${list}</div>
          <button class="btn btn-primary" id="importCommunity" ${state.selectedCommunity && !offline ? '' : 'disabled'} style="margin-top:10px">Open selected case as replay PREVIEW</button>
        </div>
        <div>
          <h3>Selected fixture</h3>
          <pre class="code-box" id="communityDetail">${esc(state.selectedCommunity ? JSON.stringify(state.selectedCommunity, null, 2) : 'Select a retrieved fixture to inspect publisher, owner, expiration, digest and original outcomes.')}</pre>
          <p class="muted" style="font-size:12px;margin-top:10px">Known entities (historical): gas ${shortHash(BRIEFING.arkiv.gasEntity)} · uniswap ${shortHash(BRIEFING.arkiv.uniswapEntity)}</p>
        </div>
      </div>
    </div>`;
}

function renderSwarm() {
  const s = BRIEFING.swarm;
  const milestones = [
    { title: 'Contracts compiled', status: s.contractsCompiled ? 'Verified' : 'Not done', ok: s.contractsCompiled, note: 'Owned unsafe/safe validators + ActionRecorder via solc 0.8.28' },
    { title: 'Offline signature binding', status: s.offlineSignatureBinding ? 'Verified' : 'Not done', ok: s.offlineSignatureBinding, note: 'Frame Mutation Engine v2 calldata mutation + ECDSA checks' },
    { title: 'Devnet preflight', status: s.readOnlyPreflight ? 'Read-only verified' : 'Not done', ok: s.readOnlyPreflight, note: 'Allowlisted RPC reads only · no broadcast' },
    { title: 'Live authorization experiment', status: 'Not executed', ok: false, note: 'Requires separate live approval and funded deployer' },
    { title: 'LLM-driven investigation', status: 'Not implemented / not configured', ok: false, note: 'No real LLM calls at latest checkpoint' },
    { title: 'Independent live reproduction', status: 'Not executed', ok: false, note: 'No unauthorized action proven' },
  ];
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="eyebrow">Experimental</div>
          <h2>Swarm Lab</h2>
          <p class="summary">LLM Hypothesis → Semantic Mutation → Deterministic Executor → Independent Verifier → Regression Case</p>
        </div>
        <span class="pill idle">FRAMEFUZZ_SWARM defaults off</span>
      </div>
      <div class="alert">This page is honest about implementation status. No fabricated agents are actively investigating. Offline cryptographic validation exists; live EIP-8141 validator execution is not yet verified.</div>
      <div class="pipeline" style="margin:18px 0">
        <div class="node">LLM Hypothesis</div><div class="arrow">→</div>
        <div class="node">Semantic Mutation</div><div class="arrow">→</div>
        <div class="node">Deterministic Executor</div><div class="arrow">→</div>
        <div class="node">Independent Verifier</div><div class="arrow">→</div>
        <div class="node">Regression Case</div>
      </div>
      <div class="milestone-grid">
        ${milestones.map((m) => `
          <div class="milestone">
            <span class="tag ${m.ok ? 'ok' : 'idle'}">${esc(m.status)}</span>
            <h4>${esc(m.title)}</h4>
            <p>${esc(m.note)}</p>
          </div>`).join('')}
      </div>
      <p class="muted" style="margin-top:16px;font-size:12px">Artifact: <code class="mono">${esc(s.artifact)}</code>. Live submission controls are not exposed here.</p>
    </div>`;
}

function renderBriefing() {
  const g = BRIEFING.gasCampaign;
  const u = BRIEFING.uniswap;
  const slides = `
    <section class="briefing-slide" data-slide="0" id="slide-what">
      <div class="eyebrow">Slide 01</div>
      <h2>FrameFuzz — Break the transaction before the mempool does.</h2>
      <p class="lede">FrameFuzz tests the compatibility and security assumptions of programmable Ethereum transactions against observable admission behavior.</p>
      <div class="claim-grid">
        <div class="claim"><strong>1. Generate</strong>Semantic EIP-8141 transaction mutations with fresh signatures.</div>
        <div class="claim"><strong>2. Compare</strong>Public and alternative admission behavior with rule-aware oracles.</div>
        <div class="claim"><strong>3. Preserve</strong>Evidence-backed regressions for wallet and paymaster developers.</div>
      </div>
    </section>

    <section class="briefing-slide" data-slide="1" id="slide-why">
      <div class="eyebrow">Slide 02</div>
      <h2>Why this matters</h2>
      <ul>
        <li>EIP-8141 introduces programmable validation and frame-based execution in an <strong>experimental</strong> environment — not mainnet functionality.</li>
        <li>Public and alternative admission policies differ for the same semantic transaction.</li>
        <li>External mutable-state reads and validation gas constraints affect admission.</li>
        <li>Wallet and paymaster developers need repeatable compatibility tests, not one-off demos.</li>
      </ul>
    </section>

    <section class="briefing-slide" data-slide="2" id="slide-how">
      <div class="eyebrow">Slide 03</div>
      <h2>How FrameFuzz works</h2>
      <div class="arch">
        <div class="arch-row"><div class="arch-box">SEMANTIC TEST DEFINITION</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">DETERMINISTIC MUTATION GENERATOR</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">UNSIGNED FRAME TRANSACTION MODEL</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">FRESH SIGNING / SAFETY ADAPTER</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-branch">
          <div class="arch-box">PUBLIC PATH<br><span class="tiny mono">eth_sendRawTransaction · type-0x06</span></div>
          <div class="arch-box">ALTERNATIVE PATH<br><span class="tiny mono">eth_sendFrameTransaction · structured</span></div>
        </div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">EXPECTED RULE ORACLE vs ACTUAL ADMISSION</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">RECEIPTS + PROVENANCE + EVIDENCE</div></div>
        <div class="arch-row muted">↓</div>
        <div class="arch-row"><div class="arch-box">ARKIV REGRESSION REGISTRY</div></div>
      </div>
      <p class="muted" style="margin-top:12px;font-size:12px">Paths may share a host; they are separate admission methods, not necessarily separate physical machines.</p>
    </section>

    <section class="briefing-slide" data-slide="3" id="slide-anatomy">
      <div class="eyebrow">Slide 04</div>
      <h2>Actual EIP-8141 frame anatomy</h2>
      <div class="frame-anatomy">
        <div class="frame-card"><div class="step">1 · VERIFY</div><h3>Sender authorization</h3><p class="muted">Execution approval must target tx.sender. Signature validation binds what it authorizes.</p></div>
        <div class="frame-card"><div class="step">2 · VERIFY</div><h3>Paymaster / payment</h3><p class="muted">Separate paymasters approve payment only. Sender approval precedes payer approval.</p></div>
        <div class="frame-card"><div class="step">3 · SENDER</div><h3>Action execution</h3><p class="muted">Authorized action frame. Calldata and targets must match the signed commitment.</p></div>
      </div>
      <div class="alert bad" style="margin-top:16px">A separate paymaster cannot approve execution on behalf of the sender merely by requesting a broader scope. Authorization rules and admission rules are different layers.</div>
    </section>

    <section class="briefing-slide" data-slide="4" id="slide-gas">
      <div class="eyebrow">Slide 05</div>
      <h2>Proof: gas boundary</h2>
      <p class="lede mono" style="font-size:22px;font-weight:700;color:var(--text)">30,000 + 67,200 + 2,800 = 100,000</p>
      ${boundaryViz()}
      <div class="grid-4" style="margin-top:16px">
        <div class="metric"><div class="metric-label">Variants</div><div class="metric-value">${g.variants}</div></div>
        <div class="metric"><div class="metric-label">Live admission checks</div><div class="metric-value">${g.admissionChecks}</div></div>
        <div class="metric"><div class="metric-label">Oracle matches</div><div class="metric-value" style="color:var(--success)">${g.matchedDecisions}</div></div>
        <div class="metric"><div class="metric-label">Included success</div><div class="metric-value">${g.includedSuccess}</div></div>
      </div>
      <p class="muted" style="margin-top:12px">No confirmed protocol discrepancy. Captured ${fmtTime(g.capturedAt)}.</p>
      <button class="btn btn-secondary" data-open-hint="947a7e01" style="margin-top:8px">Inspect Evidence</button>
    </section>

    <section class="briefing-slide" data-slide="5" id="slide-uniswap">
      <div class="eyebrow">Slide 06 · EF-specific</div>
      <h2>Proof: alternative-mempool-only admission</h2>
      <div class="matrix" style="margin-top:14px">
        <div class="head">Scenario</div><div class="head">Public</div><div class="head">Alternative</div>
        ${u.rows.map((r) => `
          <div class="scenario">${esc(r.label)}</div>
          <div class="${r.public.admission === 'accepted' ? 'cell-ok' : 'cell-bad'}">${esc(r.public.admission.toUpperCase())}<div class="tiny">${esc(r.public.receipt)}</div></div>
          <div class="${r.alt.admission === 'accepted' ? 'cell-ok' : 'cell-bad'}">${esc(r.alt.admission.toUpperCase())}<div class="tiny">${esc(r.alt.receipt)}</div></div>`).join('')}
      </div>
      <div class="copy-row" style="margin-top:16px">
        <span class="muted">Historical alt inclusion hash</span>
        <code id="altHash">${u.rows[2].alt.hash}</code>
        <button class="btn btn-ghost btn-sm" data-copy="${u.rows[2].alt.hash}">${icon('copy')} Copy</button>
      </div>
      <p style="margin-top:14px">The paymaster validation performs a real Uniswap v4 storage read. The alternative policy's staking exception permits the observed validation path, while the public admission path rejects the external state dependency.</p>
      <div class="alert" style="margin-top:12px">Never claim a swap or active liquidity trade occurred. Distinguish admission from inclusion.</div>
      <button class="btn btn-secondary" data-open-hint="3a838bca" style="margin-top:8px">Inspect Evidence</button>
    </section>

    <section class="briefing-slide" data-slide="6" id="slide-swarm">
      <div class="eyebrow">Slide 07</div>
      <h2>From known rule boundaries to adversarial authorization</h2>
      <div class="vs-grid">
        <div class="vs-card unsafe">
          <span class="tag bad">Unsafe fixture</span>
          <h3>Partial authorization</h3>
          <ul>
            <li>Owner signs partial authorization</li>
            <li>Calldata is not committed</li>
            <li>Proposed mutation: record(1,10) → record(2,999)</li>
            <li>Retained signature still passes offline partial-binding check</li>
          </ul>
        </div>
        <div class="vs-card safe">
          <span class="tag ok">Safe fixture</span>
          <h3>Canonical commitment</h3>
          <ul>
            <li>Owner signs canonical transaction commitment</li>
            <li>Calldata mutation changes the canonical hash</li>
            <li>Retained signature fails the offline safe-binding check</li>
          </ul>
        </div>
      </div>
      <div class="row" style="margin-top:16px">
        <span class="pill ok">OFFLINE CRYPTOGRAPHIC VALIDATION COMPLETE</span>
        <span class="pill idle">LIVE EIP-8141 VALIDATOR EXECUTION NOT YET VERIFIED</span>
      </div>
      <p class="muted" style="margin-top:12px">Planned owned-fixture demonstration — NOT a confirmed protocol vulnerability or successful live exploit.</p>
    </section>

    <section class="briefing-slide" data-slide="7" id="slide-oracle">
      <div class="eyebrow">Slide 08</div>
      <h2>Why the oracle can be trusted — and its limits</h2>
      <ul>
        <li>Versioned rule model with pinned evidence digests</li>
        <li>Expected policy calculated before RPC observation</li>
        <li>Actual client determines admission</li>
        <li>Evidence includes raw diagnostics and receipts</li>
        <li>Confidence classes: VERIFIED / INFERRED / UNKNOWN</li>
        <li>Hash and provenance checks; fixture drift downgrades confidence</li>
        <li>Infrastructure errors separated from policy rejections</li>
        <li>Intentional public/alt policy differences are not vulnerabilities</li>
      </ul>
      <div class="alert info">14/14 matching test decisions support the tested cases; they do not prove exhaustive protocol correctness.</div>
    </section>

    <section class="briefing-slide" data-slide="8" id="slide-blockers">
      <div class="eyebrow">Slide 09</div>
      <h2>Known blockers</h2>
      <div class="check-list">
        ${[
    'Workshop codec versus current EIP-8141 draft hash/envelope differences.',
    'Exact live client TXPARAM(SIG_HASH) compatibility unverified.',
    'Sidecar previously failed with disk exhaustion (dated capture; do not imply current health from stale observations).',
    'Last observed head was stale at milestone-2 preflight; block production/writes unverified at that capture.',
    'Deployer and owner context not configured at last preflight.',
    'New validator attack not executed live.',
    'Agentic LLM provider not yet run.',
    'Sidecar binary commit unavailable despite version response.',
  ].map((t, i) => `<div class="check-item"><span class="tag idle">${i + 1}</span><div>${esc(t)}</div></div>`).join('')}
      </div>
    </section>

    <section class="briefing-slide" data-slide="9" id="slide-faq">
      <div class="eyebrow">Slide 10</div>
      <h2>Tough EF questions</h2>
      <div class="faq">
        ${FAQ.map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')}
      </div>
    </section>

    <section class="briefing-slide" data-slide="10" id="slide-ask">
      <div class="eyebrow">Slide 11</div>
      <h2>Questions we want to ask EF</h2>
      <div class="check-list" id="efQuestions">
        ${[
    'Which signing-hash/envelope version does the running chain-1337 execution client actually implement? Is there a canonical test vector for an empty-msg ARBITRARY witness?',
    'Is block production healthy, and is the sidecar\'s persistence/disk-full issue fixed?',
    'Can EF identify the deployed sidecar commit and which draft of ERC-8421 it implements?',
    'Is there a confirmed working custom sender-validator example using TXPARAM(SIG_HASH), SIGDATACOPY and separate PAYMENT approval?',
    'Would EF prioritize multi-rule admission coverage or independently reproduced cross-frame authorization regressions for the bounty?',
  ].map((q, i) => `<label class="check-item"><input type="checkbox" data-ef-q="${i}"/><div>${esc(q)}</div></label>`).join('')}
      </div>
      <div class="notes-area" style="margin-top:16px">
        <label class="field">Local notes (stay in this browser tab — not persisted to evidence or a server)
          <textarea id="efNotes" placeholder="Scratch notes for the conversation…"></textarea>
        </label>
      </div>
    </section>

    <section class="briefing-slide" data-slide="11" id="slide-close">
      <div class="eyebrow">Slide 12</div>
      <h2>FrameFuzz turns transaction admission assumptions into reproducible tests.</h2>
      <p class="lede mono" style="font-size:18px;font-weight:600">Generate → Execute → Explain → Verify → Preserve</p>
      <p>Our goal isn't to claim a zero-day from a hackathon. It's to give wallet, account and paymaster developers the regression infrastructure they need as frame transactions and alternative-mempool policies evolve.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" data-nav="evidence">Explore Evidence</button>
        <button class="btn btn-secondary" data-nav="campaigns">Open Campaigns</button>
        <button class="btn btn-secondary" data-nav="arkiv">Inspect Arkiv Cases</button>
      </div>
    </section>`;

  return `
    <div class="present-bar">
      <div class="row">
        <strong>Present to EF</strong>
        <span class="pill" id="slideProgress">01 / ${SLIDES.length}</span>
      </div>
      <div class="row">
        <button class="btn btn-secondary btn-sm" id="prevSlide">← Previous</button>
        <button class="btn btn-secondary btn-sm" id="nextSlide">Next →</button>
        <button class="btn btn-primary btn-sm" id="exitPresent">Back to Dashboard</button>
      </div>
    </div>
    <div class="briefing-toolbar">
      <div>
        <div class="eyebrow">Technical Briefing</div>
        <h1 style="margin:0;font-size:28px;letter-spacing:-.03em">Present to Ethereum Foundation engineers</h1>
        <p class="muted" style="margin:6px 0 0">Scroll mode or Focus Mode · keyboard arrows in presentation · no network required</p>
      </div>
      <div class="row hide-in-present">
        <button class="btn btn-primary" id="enterPresent">${icon('play')} Present to EF</button>
        <button class="btn btn-secondary" data-nav="overview">Dashboard</button>
      </div>
    </div>
    ${slides}`;
}

function pageHtml() {
  switch (state.page) {
    case 'campaigns': return renderCampaigns();
    case 'evidence': return renderEvidence();
    case 'arkiv': return renderArkiv();
    case 'swarm': return renderSwarm();
    case 'briefing': return renderBriefing();
    default: return renderOverview();
  }
}

function render() {
  renderShellChrome();
  $('pageRoot').innerHTML = pageHtml();
  bindPage();
  if (state.presenting) applyPresentSlide();
}

function bindPage() {
  document.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });
  document.querySelectorAll('[data-run]').forEach((el) => {
    el.addEventListener('click', () => {
      loadRun(el.dataset.run);
      if (state.page === 'overview') navigate('evidence');
    });
  });
  document.querySelectorAll('[data-open-hint]').forEach((el) => {
    el.addEventListener('click', async () => {
      const hit = findRunByHint(el.dataset.openHint);
      if (hit) {
        await loadRun(hit.id);
        if (el.dataset.case && state.active) {
          const idx = state.active.results.findIndex((c) => c.id === el.dataset.case);
          if (idx >= 0) state.selectedCase = idx;
        }
        navigate('evidence');
      } else {
        setStatus(`Saved run containing ${el.dataset.openHint} is not in the current results directory.`);
        navigate('evidence');
      }
    });
  });
  document.querySelectorAll('[data-case]').forEach((el) => {
    el.addEventListener('click', () => {
      state.selectedCase = Number(el.dataset.case);
      render();
    });
  });
  document.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      state.evidenceFilter = el.dataset.filter;
      render();
    });
  });
  document.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async () => {
      const ok = await copyText(el.dataset.copy);
      setStatus(ok ? 'Copied to clipboard' : 'Copy failed');
    });
  });

  const runSelect = $('runSelect');
  if (runSelect) runSelect.addEventListener('change', (e) => loadRun(e.target.value));

  const suite = $('mutationSuite');
  if (suite) {
    suite.addEventListener('change', () => {
      const count = $('mutationCount');
      if (count) count.value = suite.value === 'uniswap-storage' ? 3 : 7;
    });
  }

  $('previewMutation')?.addEventListener('click', () => runMutations(false));
  $('submitMutation')?.addEventListener('click', () => runMutations(true));
  $('checkNetwork')?.addEventListener('click', checkNetwork);
  $('runButton')?.addEventListener('click', runLiveSuite);
  $('queryCommunity')?.addEventListener('click', queryCommunity);
  $('importCommunity')?.addEventListener('click', importCommunity);
  document.querySelectorAll('[data-community-key]').forEach((el) => {
    el.addEventListener('click', () => selectCommunity(el.dataset.communityKey));
  });

  $('enterPresent')?.addEventListener('click', enterPresent);
  $('exitPresent')?.addEventListener('click', exitPresent);
  $('prevSlide')?.addEventListener('click', () => stepSlide(-1));
  $('nextSlide')?.addEventListener('click', () => stepSlide(1));

  const notes = $('efNotes');
  if (notes) {
    notes.value = sessionStorage.getItem('framefuzz-ef-notes') || '';
    notes.addEventListener('input', () => sessionStorage.setItem('framefuzz-ef-notes', notes.value));
  }
}

async function runMutations(submit) {
  const seed = Number($('mutationSeed')?.value);
  const count = Number($('mutationCount')?.value);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff || !Number.isSafeInteger(count) || count < 1 || count > 1000) {
    setStatus('Use an integer seed (0–4294967295) and count (1–1000).');
    return;
  }
  setStatus(submit ? 'Generating, checking setup and signing independent variants…' : 'Generating unsigned semantic mutations offline…');
  try {
    const d = await api.mutate({
      suite: $('mutationSuite').value,
      seed,
      count,
      submit,
      preview: !submit,
    });
    await refresh(false);
    await loadRun(d.file);
    setStatus(`${d.source}: ${d.totals.cases} variants, ${d.totals.matched} matches, ${d.totals.unexpected} unexpected.`);
  } catch (e) {
    setStatus(`Mutation run failed: ${e.message}`);
  }
}

async function checkNetwork() {
  setStatus('Checking configured chain IDs…');
  try {
    const d = await api.network();
    state.gatewayStatus = (d.endpoints || []).map((x) => `${x.id}: ${x.state}${x.chainId ? ` (chain ${x.chainId})` : ''}${x.message ? ` · ${x.message}` : ''}`).join(' | ') || 'No gateways configured';
    setStatus('Gateway check complete');
    render();
  } catch (e) {
    state.gatewayStatus = e.message;
    setStatus(e.message);
    render();
  }
}

async function runLiveSuite() {
  setStatus('Running: checking chain IDs, preparing independent variants, submitting and checking receipts…');
  try {
    const d = await api.runSuite({
      scenario: $('scenarioSelect')?.value,
      mutationFamily: $('mutationSelect')?.value,
    });
    await refresh(false);
    await loadRun(d.file);
    setStatus(`Finished: ${d.totals.matched} expected, ${d.totals.unexpected} unexpected, ${d.totals.inconclusive} inconclusive.`);
  } catch (e) {
    setStatus(`Run failed: ${e.message}`);
  }
}

async function queryCommunity() {
  try {
    const q = new URLSearchParams();
    for (const [key, id] of [['suite', 'communitySuite'], ['rule', 'communityRule'], ['implementation', 'communityVersion'], ['owner', 'communityOwner']]) {
      const v = $(id)?.value?.trim();
      if (v) q.set(key, v);
    }
    const d = await api.community(q);
    state.community = d;
    state.selectedCommunity = null;
    const status = $('communityStatus');
    render();
    const el = $('communityStatus');
    if (el) {
      el.textContent = `${d.source} · chain ${d.chainId} · block ${d.currentBlock} · reader ${d.reader.walletAddress ?? 'public anonymous'} · ${d.cases.length} active · ${d.rejected.length} quarantined`;
    }
  } catch (e) {
    setStatus(`Arkiv query failed: ${e.message}`);
    const el = $('communityStatus');
    if (el) el.textContent = `Arkiv query failed: ${e.message}`;
  }
}

async function selectCommunity(key) {
  try {
    const retrieved = await api.communityCase(key);
    state.selectedCommunity = retrieved;
    render();
  } catch (e) {
    setStatus(e.message);
  }
}

async function importCommunity() {
  if (!state.selectedCommunity?.key) return;
  try {
    const d = await api.communityImport(state.selectedCommunity.key);
    await refresh(false);
    await loadRun(d.file);
    navigate('campaigns');
    setStatus(`${d.source} · ${d.submissions} broadcasts · imported preview`);
  } catch (e) {
    setStatus(`Import failed: ${e.message}`);
  }
}

function enterPresent() {
  state.slideIndex = 0;
  state.page = 'briefing';
  state.presenting = true;
  document.body.classList.add('presenting');
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === 'briefing');
  });
  render();
}

function exitPresent() {
  state.presenting = false;
  document.body.classList.remove('presenting');
  render();
}

function stepSlide(delta) {
  state.slideIndex = Math.max(0, Math.min(SLIDES.length - 1, state.slideIndex + delta));
  applyPresentSlide();
}

function applyPresentSlide() {
  document.querySelectorAll('.briefing-slide').forEach((el, i) => {
    el.classList.toggle('active-slide', i === state.slideIndex);
  });
  const prog = $('slideProgress');
  if (prog) prog.textContent = `${String(state.slideIndex + 1).padStart(2, '0')} / ${SLIDES.length}`;
  document.querySelector('.briefing-slide.active-slide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function refresh(loadDefault = true) {
  try {
    const [config, r] = await Promise.all([api.config(), api.runs()]);
    state.config = config;
    state.runs = r.runs ?? [];
    if (loadDefault) {
      if (state.runs.length) {
        const saved = state.active?.generatedAt;
        const hit = state.runs.find((x) => x.generatedAt === saved);
        const chosen = hit?.id ?? config.defaultRun ?? state.runs[0].id;
        await loadRun(chosen);
        return;
      }
    }
    render();
  } catch (e) {
    setStatus(`Local dashboard error: ${e.message}`);
    render();
  }
}

function onKey(e) {
  if (!state.presenting) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); stepSlide(1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); stepSlide(-1); }
  if (e.key === 'Escape') { e.preventDefault(); exitPresent(); }
}

function boot() {
  document.querySelectorAll('.nav-item[data-page]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });
  $('presentTop')?.addEventListener('click', () => enterPresent());
  $('briefingTop')?.addEventListener('click', () => navigate('briefing'));
  window.addEventListener('keydown', onKey);
  refresh();
}

boot();
