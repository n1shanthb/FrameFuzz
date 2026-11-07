import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import { PageHeader } from '../components/PageHeader';

const SLIDES = [
  { title: 'Problem', body: 'EIP-8141 frame transactions face two admission paths with different policy enforcement. Developers need reproducible differential tests, not anecdotes.' },
  { title: 'Canonical vs alternative', body: 'Public ethrex applies strict validation-prefix rules. Skandha alternative mempool can admit staked entities under ERC-7562-style rules. Same signed bytes, different decisions.' },
  { title: 'FrameFuzz', body: 'Paste Solidity, analyze, prepare a fresh signed candidate, submit canonical-first, then alternative only after genuine policy rejection. Evidence distinguishes admission from inclusion and execution.' },
  { title: 'Agents', body: 'Optional OpenRouter agents (Scout, Mutation, Validator, Critic) investigate contracts under explicit consent and sprint budget. They never invent live admission outcomes.' },
  { title: 'Arkiv', body: 'Community regressions on Arkiv Rabdi are discoverable, importable as unsigned previews, and publishable only with operator authorization.' },
  { title: 'Limitations', body: 'No mainnet claims. No fabricated receipts. Dropped mempool admissions are not mined inclusion. Storage-access live path is a supported scenario, not arbitrary BYOC deploy.' },
];

export function BriefingPage() {
  const [present, setPresent] = useState(false);
  const [idx, setIdx] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Technical Briefing"
        subtitle="Judge-facing overview of EIP-8141 differential admission testing."
        action={<Button variant="contained" onClick={() => { setPresent(true); setIdx(0); }}>Presentation mode</Button>}
      />
      <Stack spacing={2}>
        {SLIDES.map((s) => (
          <Paper key={s.title} sx={{ p: 2.5 }}>
            <Typography variant="h3">{s.title}</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>{s.body}</Typography>
          </Paper>
        ))}
      </Stack>
      <Dialog fullScreen open={present} onClose={() => setPresent(false)}>
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 4, bgcolor: '#0F172A', color: '#F8FAFC' }}>
          <Box sx={{ maxWidth: 880 }}>
            <Typography variant="overline" sx={{ color: '#94A3B8' }}>FrameFuzz · {idx + 1}/{SLIDES.length}</Typography>
            <Typography variant="h1" sx={{ color: '#fff', fontSize: { xs: '2rem', md: '3rem' }, mt: 1 }}>{SLIDES[idx].title}</Typography>
            <Typography variant="h3" sx={{ color: '#CBD5E1', fontWeight: 400, mt: 3, lineHeight: 1.5 }}>{SLIDES[idx].body}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 4 }}>
              <Button variant="outlined" sx={{ color: '#fff', borderColor: '#475569' }} disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>Back</Button>
              <Button variant="contained" onClick={() => (idx < SLIDES.length - 1 ? setIdx((i) => i + 1) : setPresent(false))}>
                {idx < SLIDES.length - 1 ? 'Next' : 'Close'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}
