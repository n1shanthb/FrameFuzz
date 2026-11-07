import Chip from '@mui/material/Chip';

const map: Record<string, { color: 'success' | 'error' | 'warning' | 'info' | 'default'; label?: string }> = {
  ACCEPTED: { color: 'success' },
  REJECTED_POLICY: { color: 'error' },
  REJECTED_PRECONDITION: { color: 'warning' },
  POLICY_DIVERGENCE: { color: 'warning', label: 'POLICY DIVERGENCE' },
  NONE: { color: 'default', label: 'NO DIVERGENCE' },
  READY: { color: 'success' },
  READY_FOR_LIVE_COMPARISON: { color: 'success' },
  BLOCKED_PRECONDITION: { color: 'warning' },
  UNAVAILABLE: { color: 'error' },
  DROPPED: { color: 'warning' },
  MINED: { color: 'success' },
  ADMITTED_NOT_MINED: { color: 'info' },
  NOT_TESTED: { color: 'default' },
  INCONCLUSIVE: { color: 'warning' },
  LIVE: { color: 'info' },
  COMPLETE: { color: 'success' },
  STAKED: { color: 'success' },
};

export function StatusChip({ value, size = 'small' }: { value?: string | null; size?: 'small' | 'medium' }) {
  if (!value) return <Chip size={size} label="—" variant="outlined" />;
  const cfg = map[value] ?? { color: 'default' as const };
  return <Chip size={size} color={cfg.color} label={cfg.label ?? value} variant={cfg.color === 'default' ? 'outlined' : 'filled'} />;
}
