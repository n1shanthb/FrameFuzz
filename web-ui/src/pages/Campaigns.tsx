import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { api } from '../api/client';
import { useApp } from '../layout/AppContext';

export function CampaignsPage() {
  const { config } = useApp();
  const [suite, setSuite] = useState('verification-gas');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const suites = config?.mutations?.suites || ['verification-gas', 'uniswap-storage'];

  useEffect(() => {
    if (suites[0]) setSuite(suites[0]);
  }, [suites.join(',')]);

  async function preview() {
    setBusy(true); setError('');
    try {
      setResult(await api.mutate({ suite, seed: 42, count: 7, preview: true }) as Record<string, unknown>);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Box>
      <PageHeader title="Test Campaigns" subtitle="Deterministic mutation campaigns. Preview stays unsigned — live submission remains separately authorized." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 2.5, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField select size="small" label="Suite" value={suite} onChange={(e) => setSuite(e.target.value)} sx={{ minWidth: 220 }}>
            {suites.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={busy} onClick={preview}>Generate preview</Button>
        </Stack>
        <Typography variant="body2" sx={{ mt: 1.5 }}>Max live variants: {config?.mutations?.maxLiveVariants ?? '—'}. This button does not broadcast.</Typography>
      </Paper>
      {result && (
        <Paper sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <StatusChip value={String(result.source || 'PREVIEW')} />
            <Typography variant="body2">{Array.isArray(result.results) ? result.results.length : 0} variants</Typography>
          </Stack>
          <Box component="pre" sx={{ m: 0, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', maxHeight: 420, overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
