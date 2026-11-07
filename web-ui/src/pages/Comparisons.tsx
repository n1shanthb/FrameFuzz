import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { Mono, shortHash } from '../components/Mono';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import { GitCompareArrows } from 'lucide-react';
import type { CapturedUniswapEvidence } from '../api/types';

function kind(source?: string) {
  if (/LIVE_RPC|LIVE\b/i.test(source || '')) return 'LIVE';
  if (/PREVIEW/i.test(source || '')) return 'PREVIEW';
  if (/MOCK/i.test(source || '')) return 'MOCK';
  if (/SIMULATION/i.test(source || '')) return 'SIMULATION';
  return 'HISTORICAL';
}

export function ComparisonsPage() {
  const [runs, setRuns] = useState<Array<Record<string, unknown>>>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.runs(),api.playground.uniswapCaptured()]).then(async ([d,captured]) => {
      const list = ((d as { runs?: Array<{ id: string }> }).runs || []) as Array<{ id: string }>;
      const c=captured as CapturedUniswapEvidence;
      setRuns([{id:c.id,source:c.provenance,capturedAt:c.capturedAt,totals:{cases:1,matched:1,unexpected:0},captured:c},...(list as unknown as Array<Record<string, unknown>>)]);
    }).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => runs.filter((r) => filter === 'all' || kind(String(r.source || '')) === filter), [runs, filter]);

  async function openRun(id: string) {
    try {
      const summary=runs.find(r=>r.id===id);const data=summary?.captured?summary.captured as Record<string,unknown>:await api.run(id) as Record<string, unknown>;
      setSelected(data);
      setDetail(data);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <Box>
      <PageHeader title="Admission Comparisons" subtitle="Completed comparison runs from persisted evidence. Past LIVE captures stay labeled — never presented as a new execution." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField select size="small" label="Provenance" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ mb: 2, minWidth: 200 }}>
        {['all', 'LIVE', 'HISTORICAL', 'PREVIEW', 'MOCK', 'SIMULATION'].map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
      </TextField>
      {filtered.length === 0 ? (
        <EmptyState icon={<GitCompareArrows size={28} />} title="No comparison runs yet" body="Run a live comparison from Contract Playground or load saved evidence." />
      ) : (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Run</TableCell>
                <TableCell>Provenance</TableCell>
                <TableCell>Cases</TableCell>
                <TableCell>Matched</TableCell>
                <TableCell>Unexpected</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={String(r.id)} hover>
                  <TableCell><Mono>{shortHash(String(r.id), 6)}</Mono><Typography variant="body2">{String(r.capturedAt || '')}</Typography></TableCell>
                  <TableCell><StatusChip value={kind(String(r.source || ''))} /></TableCell>
                  <TableCell>{(r.totals as { cases?: number })?.cases ?? '—'}</TableCell>
                  <TableCell>{(r.totals as { matched?: number })?.matched ?? '—'}</TableCell>
                  <TableCell>{(r.totals as { unexpected?: number })?.unexpected ?? '—'}</TableCell>
                  <TableCell><Button size="small" onClick={() => openRun(String(r.id))}>Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      <Drawer anchor="right" open={Boolean(detail)} onClose={() => setDetail(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}>
        {detail && (
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>{detail.provenance==='CAPTURED_LIVE_EVIDENCE'?'Captured Uniswap divergence':'Run detail'}</Typography>
            <StatusChip value={kind(String(detail.source || ''))} />
            {detail.provenance==='CAPTURED_LIVE_EVIDENCE'?<><Alert severity="info" sx={{mt:2}}>Previously completed LIVE evidence. This view does not execute the transaction.</Alert><Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.5,mt:2}}><Paper variant="outlined" sx={{p:1.5}}><Typography variant="overline">Canonical</Typography><StatusChip value={String((detail.canonical as {status?:string})?.status)}/><Typography variant="body2">{String((detail.canonical as {rule?:string})?.rule)}</Typography></Paper><Paper variant="outlined" sx={{p:1.5}}><Typography variant="overline">Alternative</Typography><StatusChip value={String((detail.alternative as {status?:string})?.status)}/><Typography variant="body2">Admission {String((detail.alternative as {admissionId?:number})?.admissionId)}</Typography></Paper></Box><Typography variant="body2" sx={{mt:2}}>Transaction</Typography><Mono copy>{String(detail.transactionIdentity)}</Mono><Typography variant="body2" sx={{mt:1}}>Frame execution {String((detail.frameSummary as {successful?:number})?.successful)}/{String((detail.frameSummary as {total?:number})?.total)} successful</Typography></>:<><Typography variant="body2" sx={{ mt: 2 }}>Export</Typography><Button href={api.exportUrl(String(selected?.id || detail.id), 'json')} sx={{ mr: 1 }}>JSON</Button><Button href={api.exportUrl(String(selected?.id || detail.id), 'markdown')}>Markdown</Button></>}
            <Box component="pre" sx={{ mt: 2, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}>
              {JSON.stringify({ id: detail.id, source: detail.source, totals: detail.totals, capturedAt: detail.capturedAt }, null, 2)}
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
