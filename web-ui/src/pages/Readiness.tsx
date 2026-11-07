import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { api } from '../api/client';
import { useApp } from '../layout/AppContext';

function card(label: string, status: string, detail?: string) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body2">{label}</Typography>
        <Box sx={{ my: 1 }}><StatusChip value={status} /></Box>
        {detail && <Typography variant="body2">{detail}</Typography>}
      </Paper>
    </Grid>
  );
}

export function ReadinessPage() {
  const { config, pgConfig } = useApp();
  const [readiness, setReadiness] = useState<Record<string, unknown> | null>(null);
  const [probe, setProbe] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.readiness().then((d) => setReadiness(d as Record<string, unknown>)).catch((e) => setError(e.message));
  }, []);

  async function runProbe() {
    setError('');
    try { setProbe(await api.readinessProbe() as Record<string, unknown>); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  const mode = String(pgConfig?.capabilityMode || config?.capabilities?.mode || '—');

  return (
    <Box>
      <PageHeader title="Live Readiness" subtitle="Independent capability status. Analysis and agents are not disabled merely because chain writes require authorization." />
      <Alert severity="info" sx={{ mb: 2 }}>
        Live analysis enabled · Chain writes require authorization. Current mode: {mode}.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={runProbe}>Bounded probe</Button>
      </Stack>
      <Grid container spacing={2}>
        {card('Solidity compiler', 'READY', pgConfig?.compiler || 'solc 0.8.28')}
        {card('OpenRouter agents', pgConfig?.investigationReadiness?.openRouterKeyPresent ? (pgConfig.canStart ? 'READY' : 'BLOCKED') : 'UNAVAILABLE', pgConfig?.investigationReadiness?.notice)}
        {card('EF canonical endpoint', config?.rpcConfigured ? 'READY' : 'UNAVAILABLE', config?.endpoints?.public || config?.endpoints?.default)}
        {card('Skandha alternative', config?.rpcConfigured ? 'READY' : 'UNAVAILABLE', config?.endpoints?.alt)}
        {card('EIP-8141 signing', pgConfig?.liveOperatorKeyConfigured ? 'READY' : 'BLOCKED', 'Owner/sender key stays on operator server')}
        {card('Live comparison writes', pgConfig?.liveAuthorized ? 'READY' : 'BLOCKED', 'Requires LIVE_AUTHORIZED')}
        {card('Arkiv read/query', config?.offlineDemo ? 'UNAVAILABLE' : 'READY', 'Chain 7794095')}
        {card('Arkiv publish auth', pgConfig?.arkivOperatorConfigured ? 'READY' : 'BLOCKED', 'Operator wallet required')}
        {card('Dashboard backend', readiness ? 'READY' : 'DEGRADED', String((readiness?.eip8141 as { status?: string })?.status || ''))}
      </Grid>
      {probe && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>Probe result</Typography>
          <Box component="pre" sx={{ m: 0, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace' }}>{JSON.stringify(probe, null, 2)}</Box>
        </Paper>
      )}
    </Box>
  );
}
