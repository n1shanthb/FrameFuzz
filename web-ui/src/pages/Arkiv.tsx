import { useEffect, useState } from 'react';
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
  const [suite, setSuite] = useState('');
  const [rule, setRule] = useState('');
  const [entityKey, setEntityKey] = useState('');
  const [cases, setCases] = useState<Array<Record<string, unknown>>>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [provenance, setProvenance] = useState('');
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function query(live: boolean) {
    setBusy(true); setError(''); setImportResult(null);
    try {
      const params = new URLSearchParams(); if(suite.trim())params.set('suite',suite.trim());if(rule.trim())params.set('rule',rule.trim());
      const data = live
        ? await api.community(params) as { cases?: Array<Record<string, unknown>>; provenance?: string }
        : await api.communitySaved(params) as { cases?: Array<Record<string, unknown>>; provenance?: string };
      setCases(data.cases || []);
      setProvenance(data.provenance || (live ? 'LIVE_QUERY' : 'SAVED_FALLBACK'));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setCases([]); }
    finally { setBusy(false); }
  }

  async function fetchCase(){setBusy(true);setError('');setSelected(null);try{setSelected(await api.communityCase(entityKey.trim()) as Record<string,unknown>);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
  useEffect(()=>{if(!config||config.offlineDemo)return;void query(true);/* initial full active query */},[config?.offlineDemo]);

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
        <Typography variant="h3" sx={{mb:.5}}>Active community cases</Typography><Typography variant="body2" sx={{mb:2}}>The default query shows every active, schema-valid Rabdi fixture. Narrow it only when needed.</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" label="Suite (optional)" placeholder="All suites" value={suite} onChange={(e) => setSuite(e.target.value)} />
          <TextField size="small" label="Rule (optional)" placeholder="All rules" value={rule} onChange={(e) => setRule(e.target.value)} />
          <Button variant="contained" disabled={busy || Boolean(config?.offlineDemo)} onClick={() => query(true)}>Refresh live</Button>
          <Button variant="outlined" disabled={busy} onClick={() => query(false)}>Saved fallback</Button>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt:1.5}}><Button size="small" onClick={()=>{setSuite('');setRule('');}}>All active</Button><Button size="small" onClick={()=>{setSuite('uniswap-storage');setRule('STORAGE_ACCESS');}}>Uniswap storage</Button><Button size="small" onClick={()=>{setSuite('verification-gas');setRule('');}}>Verification gas</Button></Stack>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Operator publish configured: {String(Boolean(pgConfig?.arkivOperatorConfigured))} · Storage-access observation publish still awaits explicit approval.
        </Typography>
      </Paper>
      {provenance && <StatusChip value={provenance} />}
      <Paper sx={{ mt: 2, border:'1px solid #CBD5E1' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{p:2,pb:1}}><Typography variant="h4">{cases.length} active case{cases.length===1?'':'s'}</Typography><Typography variant="body2">Expired and invalid entities are excluded</Typography></Stack>
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
            {cases.length===0&&!busy&&<TableRow><TableCell colSpan={5}><Alert severity="info">No active cases matched. Clear Suite and Rule to search the full registry.</Alert></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{p:2.5,mt:2}}><Typography variant="h3" sx={{mb:.5}}>Retrieve by entity key</Typography><Typography variant="body2" sx={{mb:1.5}}>Validate a known entity's digest, schema and expiry, then import it as an unsigned replay preview.</Typography><Stack direction={{xs:'column',sm:'row'}} spacing={1.5}><TextField fullWidth size="small" label="Arkiv entity key" placeholder="0x… (32 bytes)" value={entityKey} onChange={(e)=>setEntityKey(e.target.value)}/><Button variant="outlined" disabled={busy||!/^0x[\da-f]{64}$/i.test(entityKey.trim())||Boolean(config?.offlineDemo)} onClick={fetchCase}>Retrieve</Button></Stack>{selected&&<Alert severity="success" sx={{mt:2}}><Typography fontWeight={700}>Verified active entity</Typography><Mono copy>{String(selected.key||selected.entityKey||entityKey)}</Mono><Typography variant="body2">Publisher {String(selected.owner||selected.publisher||'—')} · expiry {String(selected.expiresAtBlock||'—')}</Typography><Button size="small" sx={{mt:1}} disabled={busy} onClick={()=>importCase(String(selected.key||selected.entityKey||entityKey))}>Import unsigned preview</Button></Alert>}</Paper>
      {importResult && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Imported {String(importResult.file || '')} · submissions {String(importResult.submissions ?? 0)} · historical claim, not fresh admission
        </Alert>
      )}
    </Box>
  );
}
