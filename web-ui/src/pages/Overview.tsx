import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import { ArrowRight, GitCompareArrows, Code2, FileSearch } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { api } from '../api/client';
import type { RunSummary } from '../api/types';
import { tokens } from '../theme/tokens';

function sourceKind(source?: string) {
  if (!source) return 'UNKNOWN';
  if (/LIVE/i.test(source)) return 'LIVE';
  if (/PREVIEW/i.test(source)) return 'PREVIEW';
  if (/MOCK/i.test(source)) return 'MOCK';
  return 'SAVED';
}

export function OverviewPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.runs().then((d) => setRuns((d as { runs?: RunSummary[] }).runs || (d as RunSummary[]) || [])).catch((e) => setError(e.message));
  }, []);

  const list = Array.isArray(runs) ? runs : [];
  const live = list.filter((r) => sourceKind(r.source) === 'LIVE').length;
  const cases = list.reduce((n, r) => n + (r.totals?.cases ?? 0), 0);
  const unexpected = list.reduce((n, r) => n + (r.totals?.unexpected ?? 0), 0);
  const matched = list.reduce((n, r) => n + (r.totals?.matched ?? 0), 0);

  return (
    <Box>
      <Paper sx={{ p: { xs: 3, md: 4 }, mb: 3, background: `linear-gradient(135deg, ${tokens.primarySoft} 0%, #fff 55%)`, border: `1px solid ${tokens.border}` }}>
        <Typography variant="overline" color="primary">EIP-8141 differential admission</Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.25rem' }, maxWidth: 720, mt: 1 }}>
          Break the transaction before the mempool does.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 640 }}>
          Agent-powered EIP-8141 differential admission testing across public ethrex and alternative Skandha paths.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
          <Button component={RouterLink} to="/playground" variant="contained" size="large" endIcon={<ArrowRight size={16} />}>Open Contract Playground</Button>
          <Button component={RouterLink} to="/evidence" variant="outlined" size="large">Explore Evidence</Button>
        </Stack>
      </Paper>

      <PageHeader title="Product pulse" subtitle="Metrics derived only from persisted local evidence — never fabricated." />
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Saved investigations / runs', value: list.length, icon: <FileSearch size={18} /> },
          { label: 'LIVE-classified runs', value: live, icon: <GitCompareArrows size={18} /> },
          { label: 'Case observations', value: cases, icon: <Code2 size={18} /> },
          { label: 'Matched / unexpected', value: `${matched} / ${unexpected}`, icon: <GitCompareArrows size={18} /> },
        ].map((m) => (
          <Grid key={m.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">{m.label}</Typography>
                <Box sx={{ color: 'text.secondary' }}>{m.icon}</Box>
              </Stack>
              <Typography variant="h2" sx={{ mt: 1 }}>{m.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>How FrameFuzz works</Typography>
        <Grid container spacing={2}>
          {['Source', 'Agents', 'Mutation', 'Dual Admission', 'Regression'].map((step, i) => (
            <Grid key={step} size={{ xs: 12, sm: 6, md: 4 }} sx={{ flexGrow: 1 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: tokens.primarySoft, height: '100%' }}>
                <Typography variant="overline">0{i + 1}</Typography>
                <Typography fontWeight={700}>{step}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Public ethrex and alternative Skandha receive the same signed candidate sequentially. Policy divergence is not inclusion. Admission is not execution.
        </Typography>
      </Paper>
    </Box>
  );
}
