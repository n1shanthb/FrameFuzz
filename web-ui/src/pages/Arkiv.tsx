import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { Mono, shortHash } from '../components/Mono';
import { api } from '../api/client';
import { useApp } from '../layout/AppContext';

export function ArkivPage() {
  const { pgConfig, config } = useApp();
  const [suite, setSuite] = useState('uniswap-storage');
  const [rule, setRule] = useState('STORAGE_ACCESS');
  const [cases, setCases] = useState<Array<Record<string, unknown>>>([]);
  const [provenance, setProvenance] = useState('');
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function query(live: boolean) {
    setBusy(true); setError(''); setImportResult(null);
    try {
      const params = new URLSearchParams({ suite, rule });
      const data = live
        ? await api.community(params) as { cases?: Array<Record<string, unknown>>; provenance?: string }
        : await api.communitySaved(params) as { cases?: Array<Record<string, unknown>>; provenance?: string };
      setCases(data.cases || []);
      setProvenance(data.provenance || (live ? 'LIVE_QUERY' : 'SAVED_FALLBACK'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setCases([]); }
    finally { setBusy(false); }
  }

  async function importCase(key: string) {
    setBusy(true); setError('');
    try { setImportResult(await api.communityImport(key) as Record<string, unknown>); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Box>
      <PageHeader title="Arkiv Registry" subtitle="Discover community regressions on Arkiv Rabdi. Import stays unsigned. Publication requires separate operator approval." />
      {config?.offlineDemo && <Alert severity="info" sx={{ mb: 2 }}>Offline demo disables live Arkiv discovery. Use saved fallback.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Suite" value={suite} onChange={(e) => setSuite(e.target.value)} />
          <TextField size="small" label="Rule" value={rule} onChange={(e) => setRule(e.target.value)} />
          <Button variant="contained" disabled={busy || Boolean(config?.offlineDemo)} onClick={() => query(true)}>Live query</Button>
          <Button variant="outlined" disabled={busy} onClick={() => query(false)}>Saved fallback</Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Operator publish configured: {String(Boolean(pgConfig?.arkivOperatorConfigured))} · Storage-access observation publish still awaits explicit approval.
        </Typography>
      </Paper>
      {provenance && <StatusChip value={provenance} />}
      <Paper sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Entity</TableCell>
              <TableCell>Suite / Rule</TableCell>
              <TableCell>Publisher</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={String(c.key || c.entityKey)}>
                <TableCell><Mono copy>{shortHash(String(c.key || c.entityKey))}</Mono></TableCell>
                <TableCell>{String(c.suite || c.record && (c.record as { suite?: string }).suite || '—')} / {String(c.ruleId || (c.record as { ruleId?: string })?.ruleId || '—')}</TableCell>
                <TableCell><Mono>{shortHash(String(c.owner || c.publisher || ''), 4)}</Mono></TableCell>
                <TableCell>{String(c.expiresAtBlock || '—')}</TableCell>
                <TableCell><Button size="small" disabled={busy} onClick={() => importCase(String(c.key || c.entityKey))}>Import unsigned</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {importResult && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Imported {String(importResult.file || '')} · submissions {String(importResult.submissions ?? 0)} · historical claim, not fresh admission
        </Alert>
      )}
    </Box>
  );
}
