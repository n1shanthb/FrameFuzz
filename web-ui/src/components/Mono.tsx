import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { Copy } from 'lucide-react';
import { tokens } from '../theme/tokens';

export function Mono({ children, copy, title }: { children: string; copy?: boolean; title?: string }) {
  const text = children;
  return (
    <Box component="span" sx={{ fontFamily: tokens.mono, fontSize: 12, wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 0.5 }} title={title}>
      {text}
      {copy && (
        <Tooltip title="Copy">
          <IconButton size="small" aria-label="Copy" onClick={() => navigator.clipboard.writeText(text)}>
            <Copy size={12} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export function shortHash(h?: string | null, n = 8) {
  if (!h) return '—';
  if (h.length < n * 2 + 2) return h;
  return `${h.slice(0, n + 2)}…${h.slice(-n)}`;
}
