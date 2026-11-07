import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { Mono } from '../components/Mono';
import { api } from '../api/client';

export function EvidencePage() {
  const [runs, setRuns] = useState<Array<{ id: string; source?: string; capturedAt?: string }>>([]);
  const [active, setActive] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api.runs().then((d) => setRuns(((d as { runs?: typeof runs }).runs) || [])).catch((e) => setError(e.message));
  }, []);

  async function load(id: string) {
    try { setActive(await api.run(id) as Record<string, unknown>); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  const results = (active?.results as unknown[]) || [];

  return (
    <Box>
      <PageHeader title="Evidence Explorer" subtitle="Technical explorer for RPC outcomes, admissions, receipts and provenance. Historical captures are labeled." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 2 }}>
        <Paper sx={{ maxHeight: 640, overflow: 'auto' }}>
          <List dense>
            {runs.map((r) => (
              <ListItemButton key={r.id} onClick={() => load(r.id)} selected={String(active?.id) === r.id}>
                <ListItemText primary={<Mono>{r.id}</Mono>} secondary={r.capturedAt || r.source} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p: 2 }}>
          {!active ? <Typography variant="body2">Select a saved run.</Typography> : (
            <>
              <StatusChip value={String(active.source || 'SAVED')} />
              <Button href={api.exportUrl(String(active.id), 'json')} sx={{ ml: 1 }}>Export JSON</Button>
              <Button href={api.exportUrl(String(active.id), 'markdown')}>Markdown</Button>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 1 }}>
                <Tab label="Summary" /><Tab label="Cases" /><Tab label="Raw JSON" />
              </Tabs>
              {tab === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">Cases: {(active.totals as { cases?: number })?.cases ?? results.length}</Typography>
                  <Typography variant="body2">Matched: {(active.totals as { matched?: number })?.matched ?? '—'}</Typography>
                  <Typography variant="body2">Unexpected: {(active.totals as { unexpected?: number })?.unexpected ?? '—'}</Typography>
                </Box>
              )}
              {tab === 1 && (
                <Box component="pre" sx={{ mt: 2, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', maxHeight: 480, overflow: 'auto' }}>
                  {JSON.stringify(results.slice(0, 20), null, 2)}
                </Box>
              )}
              {tab === 2 && (
                <Box component="pre" sx={{ mt: 2, fontSize: 11, whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace', maxHeight: 480, overflow: 'auto' }}>
                  {JSON.stringify(active, null, 2)}
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
