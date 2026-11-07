import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { api } from '../api/client';
import { useApp } from '../layout/AppContext';

export function AgentsPage() {
  const { pgConfig } = useApp();
  const [swarm, setSwarm] = useState<Record<string, unknown> | null>(null);
  const [recent, setRecent] = useState<unknown[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.swarmConfig().catch(() => null),
      api.swarmRecent().catch(() => ({ recent: [] })),
    ]).then(([c, r]) => {
      setSwarm(c as Record<string, unknown> | null);
      setRecent(((r as { recent?: unknown[] })?.recent) || []);
    }).catch((e) => setError(e.message));
  }, []);

  const readiness = pgConfig?.investigationReadiness;

  return (
    <Box>
      <PageHeader title="Agent Swarm" subtitle="Independently called model sessions for contract investigation. Consent is required before any paid OpenRouter request." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Alert severity="info" sx={{ mb: 2 }}>
        {readiness?.notice || 'Playground agents enable under LIVE_READ_ONLY / LIVE_AUTHORIZED when OpenRouter is configured. Chain broadcast is separate.'}
      </Alert>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2">OpenRouter key</Typography>
            <StatusChip value={readiness?.openRouterKeyPresent ? 'READY' : 'UNAVAILABLE'} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2">Investigation start</Typography>
            <StatusChip value={pgConfig?.canStart ? 'READY' : 'BLOCKED'} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2">Sprint remaining</Typography>
            <Typography variant="h3">${Number(pgConfig?.sprintBudget?.remainingUSD ?? 0).toFixed(4)}</Typography>
          </Paper>
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button component={RouterLink} to="/playground" variant="contained">Run from Contract Playground</Button>
      </Stack>
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>Swarm / recent</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Transport {String(pgConfig?.transport || swarm?.transport || '—')} · model {String(pgConfig?.model || '—')}</Typography>
        <Box component="pre" sx={{ m: 0, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', maxHeight: 360, overflow: 'auto' }}>
          {JSON.stringify({ swarmConfig: swarm, recent }, null, 2)}
        </Box>
      </Paper>
    </Box>
  );
}
