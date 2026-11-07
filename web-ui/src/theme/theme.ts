import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.primary, contrastText: '#fff' },
    success: { main: tokens.success },
    error: { main: tokens.danger },
    warning: { main: tokens.warning },
    info: { main: tokens.info },
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.textSecondary },
    divider: tokens.border,
  },
  typography: {
    fontFamily: tokens.sans,
    h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontSize: '1.1rem', fontWeight: 600 },
    h4: { fontSize: '0.95rem', fontWeight: 600 },
    body1: { fontSize: '0.925rem', lineHeight: 1.6 },
    body2: { fontSize: '0.85rem', lineHeight: 1.55, color: tokens.textSecondary },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: tokens.radius },
  shadows: [
    'none',
    '0 1px 2px rgba(15,23,42,0.04)',
    '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
    '0 4px 12px rgba(15,23,42,0.06)',
    '0 8px 24px rgba(15,23,42,0.08)',
    ...Array(20).fill('0 8px 24px rgba(15,23,42,0.08)'),
  ] as unknown as ReturnType<typeof createTheme>['shadows'],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg, color: tokens.text },
        'code, .mono': { fontFamily: tokens.mono },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 14, paddingBlock: 8 },
        containedPrimary: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        outlined: { borderColor: tokens.border },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${tokens.border}` },
        elevation1: { boxShadow: '0 1px 3px rgba(15,23,42,0.06)' },
        elevation2: { boxShadow: '0 4px 12px rgba(15,23,42,0.06)' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { borderRight: `1px solid ${tokens.border}` } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, background: '#F8FAFC', color: tokens.textSecondary },
      },
    },
  },
});
