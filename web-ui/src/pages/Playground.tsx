import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { ChevronDown, Play, Save, RefreshCw, FileCode2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { Mono, shortHash } from '../components/Mono';
import { api } from '../api/client';
import { useApp } from '../layout/AppContext';
import { tokens } from '../theme/tokens';
import type { Analysis, AdmissionReadiness, LivePrepared, LiveComparison, ComparisonRow } from '../api/types';

const AGENTS = [
  { id: 'scout', name: 'Contract Scout' },
  { id: 'mutation', name: 'Semantic Mutation' },
  { id: 'validator', name: 'Feasibility Validator' },
  { id: 'critic', name: 'Evidence Critic' },
] as const;

export function PlaygroundPage() {
  const { pgConfig } = useApp();
  const [source, setSource] = useState('');
  const [contractName, setContractName] = useState('ViolatingWallet');
  const [role, setRole] = useState('SENDER_VALIDATOR');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [admission, setAdmission] = useState<AdmissionReadiness | null>(null);
  const [wallet, setWallet] = useState('');
  const [foreign, setForeign] = useState('');
  const [owner, setOwner] = useState('');
  const [prepared, setPrepared] = useState<LivePrepared | null>(null);
  const [comparison, setComparison] = useState<LiveComparison | null>(null);
  const [liveJobId, setLiveJobId] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ file?: string; contentDigest?: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobReport, setJobReport] = useState<Record<string, unknown> | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detail, setDetail] = useState<ComparisonRow | null>(null);

  const liveCapable = Boolean(analysis?.capabilities?.includes('LIVE_STORAGE_ACCESS_ADMISSION'));
  const live = admission?.liveAdmission;

  async function loadScenario() {
    setBusy('Loading supported scenario…'); setError('');
    try {
      const scen = await api.playground.supportedScenario() as { source?: string; contractName?: string; fixtures?: { wallet: string; foreign: string; owner: string }; kind?: string };
      setSource(scen.source || '');
      setContractName(scen.contractName || 'ViolatingWallet');
      setRole('SENDER_VALIDATOR');
      setWallet(scen.fixtures?.wallet || '');
      setForeign(scen.fixtures?.foreign || '');
      setOwner(scen.fixtures?.owner || '');
      setAnalysis(null); setAdmission(null); setPrepared(null); setComparison(null); setSaved(null);
      setError('Supported scenario loaded — Analyze next. Reference evidence is not LIVE.');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function analyze() {
    setBusy('Analyzing…'); setError(''); setPrepared(null); setComparison(null); setSaved(null);
    try {
      const a = await api.playground.analyze({ source, role, contractName: contractName || undefined, profile: 'byoc' }) as Analysis;
      setAnalysis(a);
      if (a.contracts?.length && !a.contractName) setContractName(a.contracts[0]);
      if (a.analysisId) {
        const q = new URLSearchParams({ analysisId: a.analysisId });
        if (wallet) q.set('wallet', wallet);
        if (foreign) q.set('foreign', foreign);
        if (owner) q.set('owner', owner);
        const r = await api.playground.admissionReadiness(q) as AdmissionReadiness;
        setAdmission(r);
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function refreshReadiness() {
    if (!analysis?.analysisId) return;
    setBusy('Refreshing readiness…'); setError('');
    try {
      const q = new URLSearchParams({ analysisId: analysis.analysisId });
      if (wallet) q.set('wallet', wallet);
      if (foreign) q.set('foreign', foreign);
      if (owner) q.set('owner', owner);
      setAdmission(await api.playground.admissionReadiness(q) as AdmissionReadiness);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function prepare() {
    if (!analysis?.analysisId || !analysis.sourceDigest) return;
    setBusy('Preparing fresh candidate…'); setError(''); setComparison(null); setSaved(null);
    try {
      const p = await api.playground.livePrepare({
        analysisId: analysis.analysisId,
        sourceDigest: analysis.sourceDigest,
        wallet, owner, foreign, verifyData: '0x01',
      }) as LivePrepared;
      setPrepared(p); setLiveJobId(p.id);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function runLive() {
    if (!prepared?.candidate?.hash || !prepared.id) return;
    setConfirmOpen(false);
    setBusy('Running live comparison…'); setError('');
    try {
      const result = await api.playground.liveRun({
        id: prepared.id,
        confirmHash: prepared.candidate.hash,
        authorizeWrites: true,
      }) as { comparison: LiveComparison; id: string; state: string };
      if (result.comparison?.provenance !== 'LIVE') throw new Error('Refusing non-LIVE result');
      setComparison(result.comparison);
      setLiveJobId(result.id);
      setPrepared(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPrepared(null); }
    finally { setBusy(''); }
  }

  async function saveRegression() {
    if (comparison?.provenance !== 'LIVE') return;
    setBusy('Saving regression…'); setError('');
    try {
      const r = await api.playground.saveRegression({
        id: liveJobId,
        analysisId: analysis?.analysisId,
        sourceDigest: analysis?.sourceDigest,
      }) as { file?: string; contentDigest?: string };
      setSaved(r);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  async function startAgents() {
    if (!consent || !analysis?.analysisId || !analysis.sourceDigest) return;
    setBusy('Starting investigation…'); setError('');
    try {
      const plan = pgConfig?.investigationBudget?.byoc;
      const job = await api.playground.start({
        analysisId: analysis.analysisId,
        sourceDigest: analysis.sourceDigest,
        authorizeProvider: true,
        budgetUSD: plan?.allocatedUSD,
      }) as { id: string };
      setJobId(job.id);
      for (;;) {
        const current = await api.playground.job(job.id) as { state: string; report?: Record<string, unknown>; error?: string };
        if (current.report) setJobReport(current.report);
        if (current.error) setError(current.error);
        if (current.state !== 'RUNNING') break;
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(''); }
  }

  const rows = comparison?.table ?? [];
  const claims = comparison?.claims ?? rows[0]?.claims;
  const agentCards = useMemo(() => {
    const agents = (jobReport?.agents ?? {}) as Record<string, { state?: string; calls?: number; costUSD?: number; id?: string; objective?: string }>;
    return AGENTS.map((a) => ({ ...a, data: agents[a.id] }));
  }, [jobReport]);

  return (
    <Box>
      <PageHeader
        title="Contract Playground"
        subtitle="Paste Solidity → Analyze → Prepare Admission Test → Run Live Comparison → Inspect Evidence → Save Regression. Public vs alternative mempool comparison is the product."
        action={<Button variant="outlined" startIcon={<FileCode2 size={16} />} onClick={loadScenario}>Load supported scenario</Button>}
      />

      {busy && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      {error && <Alert severity={/Supported scenario loaded/.test(error) ? 'info' : 'error'} sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="overline">Step A · Source</Typography>
        <Typography variant="h3" sx={{ mb: 1.5 }}>Solidity editor</Typography>
        <TextField
          value={source}
          onChange={(e) => { setSource(e.target.value); setAnalysis(null); setAdmission(null); }}
          multiline
          minRows={14}
          fullWidth
          placeholder="Paste StorageAccessValidator.sol (Foreign + ViolatingWallet)…"
          inputProps={{ spellCheck: false, style: { fontFamily: tokens.mono, fontSize: 12.5, lineHeight: 1.55 } }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          <TextField select size="small" label="Contract" value={contractName} onChange={(e) => setContractName(e.target.value)} sx={{ minWidth: 200 }}>
            {(analysis?.contracts?.length ? analysis.contracts : ['ViolatingWallet', 'Foreign']).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Declared role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ minWidth: 200 }}>
            {['UNKNOWN', 'EXECUTION_TARGET', 'SENDER_VALIDATOR', 'PAYMASTER'].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={analyze} disabled={!source.trim() || Boolean(busy)}>Detect / Analyze</Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1 }}>solc 0.8.28 · HegotaSupport imports from local package only · live path = labeled storage-access validator</Typography>
      </Paper>

      {analysis && (
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="overline">Step B · Analysis</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <StatusChip value={analysis.status} />
            <StatusChip value={analysis.detectedRole?.role} />
            {liveCapable ? <StatusChip value="READY" /> : <StatusChip value="REQUIRES SETUP" />}
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="body2">Contract</Typography><Typography fontWeight={600}>{analysis.contractName || '—'}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="body2">Compiler</Typography><Typography fontWeight={600}>{analysis.compiler || pgConfig?.compiler || '—'}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="body2">ABI functions</Typography><Typography fontWeight={600}>{analysis.functions?.length ?? 0}</Typography></Grid>
            <Grid size={{ xs: 12, md: 3 }}><Typography variant="body2">Capabilities</Typography><Typography fontWeight={600} sx={{ fontSize: 12 }}>{(analysis.capabilities || []).slice(0, 3).join(', ') || 'None'}</Typography></Grid>
          </Grid>
          <Typography variant="body2" sx={{ mt: 1.5 }}>Source digest</Typography>
          <Mono copy>{analysis.sourceDigest || '—'}</Mono>
          <Typography variant="body2" sx={{ mt: 1 }}>{analysis.detectedRole?.basis}</Typography>
          {(analysis.missingPrerequisites?.length ?? 0) > 0 && (
            <Alert severity="info" sx={{ mt: 1.5 }}>Missing: {analysis.missingPrerequisites?.join(' · ')}</Alert>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="overline">Step C · Agent swarm</Typography>
        <Typography variant="h3" sx={{ mb: 1 }}>Four independent model sessions</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Optional for the live admission demo. No paid call until you consent and Start. ABI-only runs are discouraged.</Typography>
        <FormControlLabel control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />} label={`I consent to OpenRouter under the sprint budget (remaining $${Number(pgConfig?.sprintBudget?.remainingUSD ?? 0).toFixed(4)}). No chain/Arkiv writes from Start.`} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button variant="contained" disabled={!consent || analysis?.status !== 'READY' || !pgConfig?.canStart || Boolean(busy)} onClick={startAgents}>Start Investigation</Button>
          {jobId && <Button variant="outlined" onClick={() => jobId && api.playground.cancel(jobId)}>Cancel</Button>}
        </Stack>
        <Grid container spacing={1.5}>
          {agentCards.map((a) => (
            <Grid key={a.id} size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.75, bgcolor: '#FCFDFE' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600}>{a.name}</Typography>
                  <StatusChip value={a.data?.state || (jobId ? 'WAITING' : 'NOT STARTED')} />
                </Stack>
                <Typography variant="body2" sx={{ mt: 1, fontFamily: tokens.mono, fontSize: 11 }}>{a.data?.id || (jobId ? `${jobId}:${a.id}` : 'Session not started')}</Typography>
                <Typography variant="body2">{a.data?.calls ?? 0} requests · ${Number(a.data?.costUSD ?? 0).toFixed(6)}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {liveCapable && (
        <Paper sx={{ p: 2.5, mb: 2 }}>
          <Typography variant="overline">Steps D–G · Public vs alternative admission</Typography>
          <Typography variant="h3" sx={{ mb: 1 }}>Live mempool comparison</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {pgConfig?.supportedScenario?.kind || 'SUPPORTED_SCENARIO_NOT_ARBITRARY_BYOC'} · template runtime {shortHash(analysis?.runtimeBytecodeHash)} · server {pgConfig?.liveAuthorized ? 'LIVE_AUTHORIZED' : 'not live-authorized'}
          </Alert>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" label="Deployed wallet" value={wallet} onChange={(e) => setWallet(e.target.value.trim())} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" label="Foreign target" value={foreign} onChange={(e) => setForeign(e.target.value.trim())} /></Grid>
            <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth size="small" label="Owner / signer" value={owner} onChange={(e) => setOwner(e.target.value.trim())} /></Grid>
          </Grid>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Button variant="outlined" startIcon={<RefreshCw size={14} />} onClick={() => {
              const f = pgConfig?.supportedScenario?.fixtures;
              if (f) { setWallet(f.wallet); setForeign(f.foreign); setOwner(f.owner); }
            }}>Bind supported fixtures</Button>
            <Button variant="outlined" onClick={refreshReadiness}>Refresh readiness</Button>
            <Button variant="outlined" onClick={prepare} disabled={!wallet || !owner}>Prepare Admission Test</Button>
            <Button variant="contained" color="primary" startIcon={<Play size={14} />} disabled={!prepared || !pgConfig?.liveAuthorized} onClick={() => setConfirmOpen(true)}>Run Live Comparison</Button>
            <Button variant="outlined" startIcon={<Save size={14} />} disabled={comparison?.provenance !== 'LIVE'} onClick={saveRegression}>Save Regression</Button>
          </Stack>
          {live && (
            <Alert severity={live.classification === 'READY_FOR_LIVE_COMPARISON' ? 'success' : 'warning'} sx={{ mb: 2 }}>
              Readiness {live.classification} · deployment {live.deployment?.status} ({live.deployment?.boundMode || String(live.deployment?.bound)}) · stake {live.stake?.status} · nonce {live.nonce ?? '—'}
              {(live.blockers?.length ?? 0) > 0 && <> · {live.blockers?.join(' · ')}</>}
            </Alert>
          )}
          {prepared && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Prepared hash <Mono copy>{prepared.candidate.hash}</Mono> · nonce {prepared.candidate.nonce} · max fee ≈ {prepared.approvalPacket?.maximumFeeExposureEth ?? '?'} ETH
            </Alert>
          )}

          {comparison?.provenance === 'LIVE' && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: tokens.dangerSoft, borderColor: '#FECACA' }}>
                    <Typography variant="overline">Public / Canonical ethrex</Typography>
                    <Box sx={{ my: 1 }}><StatusChip value={comparison.canonical?.status} size="medium" /></Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>{comparison.canonical?.message || '—'}</Typography>
                    <Typography variant="body2">Endpoint {comparison.endpoints?.canonical}</Typography>
                    <Mono copy>{comparison.transactionIdentity || ''}</Mono>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper sx={{ p: 2, bgcolor: tokens.successSoft, borderColor: '#A7F3D0' }}>
                    <Typography variant="overline">Alternative / Skandha</Typography>
                    <Box sx={{ my: 1 }}><StatusChip value={comparison.alternative?.status} size="medium" /></Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>{comparison.alternative?.message || '—'}</Typography>
                    <Typography variant="body2">Admission ID {rows[0]?.admissionId ?? rows[0]?.evidence?.sidecarAdmissionId ?? '—'}</Typography>
                    <Typography variant="body2">Later mempool {comparison.laterMempoolOutcome || rows[0]?.evidence?.laterMempoolOutcome || '—'}</Typography>
                  </Paper>
                </Grid>
              </Grid>
              <Paper sx={{ p: 2, mb: 2, textAlign: 'center', bgcolor: comparison.divergence === 'POLICY_DIVERGENCE' ? tokens.warningSoft : tokens.infoSoft }}>
                <Typography variant="overline">Divergence result</Typography>
                <Typography variant="h2">{comparison.divergence === 'POLICY_DIVERGENCE' ? 'POLICY DIVERGENCE' : comparison.divergence || 'NONE'}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ADMISSION_DIVERGENCE={String(claims?.ADMISSION_DIVERGENCE ?? false)} · INCLUSION={String(claims?.INCLUSION ?? false)} · EXECUTION_SUCCESS={String(claims?.EXECUTION_SUCCESS ?? 'NOT_OBSERVED')}
                </Typography>
              </Paper>
            </>
          )}

          <Typography variant="h4" sx={{ mb: 1 }}>Comparison table</Typography>
          {rows.length === 0 ? (
            <Typography variant="body2">No live rows yet. Table fills only from fresh RPC responses after Run Live Comparison.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mutation</TableCell>
                  <TableCell>Public</TableCell>
                  <TableCell>Alternative</TableCell>
                  <TableCell>Divergence</TableCell>
                  <TableCell>Inclusion</TableCell>
                  <TableCell>Evidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={i} hover sx={{ cursor: 'pointer' }} onClick={() => setDetail(row)}>
                    <TableCell>{row.mutation}<Typography variant="body2">{row.evidence?.timestamp}</Typography></TableCell>
                    <TableCell><StatusChip value={row.publicVerdict || row.canonicalVerdict} /><Typography variant="body2">{row.publicReason || row.evidence?.rule}</Typography></TableCell>
                    <TableCell><StatusChip value={row.alternativeVerdict} /><Typography variant="body2">admission {row.admissionId ?? row.evidence?.sidecarAdmissionId ?? 'n/a'}</Typography></TableCell>
                    <TableCell><StatusChip value={row.divergence} /></TableCell>
                    <TableCell><StatusChip value={row.inclusionStatus || (row.inclusion ? 'MINED' : 'NOT_MINED')} /></TableCell>
                    <TableCell><Mono>{shortHash(row.evidence?.transactionHash || row.evidence?.hash)}</Mono><Typography variant="body2">{row.evidence?.provenance}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {saved && <Alert severity="success" sx={{ mt: 2 }}>Saved {saved.file} · digest {saved.contentDigest} · Arkiv awaits explicit approval</Alert>}
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve bounded LIVE writes?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Hash: {prepared?.candidate.hash}</Typography>
          <Typography variant="body2">Nonce: {prepared?.candidate.nonce}</Typography>
          <Typography variant="body2">Max fee exposure: ~{prepared?.approvalPacket?.maximumFeeExposureEth ?? '?'} ETH</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Order: ethrex first, then Skandha only after policy rejection. No automatic retry. Inclusion is separate from admission.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={runLive}>Authorize & run</Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={Boolean(detail)} onClose={() => setDetail(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        {detail && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>Mutation detail</Typography>
            <Typography variant="body2">Transaction</Typography>
            <Mono copy>{detail.evidence?.transactionHash || detail.evidence?.hash || ''}</Mono>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2">Source digest</Typography>
            <Mono copy>{detail.evidence?.sourceDigest || ''}</Mono>
            <Typography variant="body2" sx={{ mt: 1 }}>Wallet</Typography>
            <Mono copy>{detail.evidence?.wallet || ''}</Mono>
            <Typography variant="body2" sx={{ mt: 1 }}>Admission ID {detail.admissionId ?? detail.evidence?.sidecarAdmissionId ?? '—'}</Typography>
            <Typography variant="body2">Inclusion {detail.inclusionStatus} · later {detail.evidence?.laterMempoolOutcome || '—'}</Typography>
            <Typography variant="body2">Captured {detail.evidence?.timestamp}</Typography>
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ChevronDown size={16} />}>Raw RPC evidence</AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{ m: 0, fontFamily: tokens.mono, fontSize: 11, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(detail.evidence?.rpc ?? detail, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
