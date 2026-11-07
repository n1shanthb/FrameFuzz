import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { NAV } from './nav';
import { api } from '../api/client';
import type { AppConfig, PlaygroundConfig } from '../api/types';
import { AppContext } from './AppContext';
import { tokens } from '../theme/tokens';

const DRAWER = 268;
const DRAWER_COLLAPSED = 76;

export function AppShell() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!mobile);
  const [collapsed, setCollapsed] = useState(false);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [pgConfig, setPgConfig] = useState<PlaygroundConfig | null>(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const width = collapsed && !mobile ? DRAWER_COLLAPSED : DRAWER;
  const page = NAV.find((n) => n.to === location.pathname) ?? NAV[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([api.config() as Promise<AppConfig>, api.playground.config() as Promise<PlaygroundConfig>]);
        if (!cancelled) { setConfig(c); setPgConfig(p); setError(''); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (mobile) setOpen(false); }, [location.pathname, mobile]);

  const mode = pgConfig?.capabilityMode ?? config?.capabilities?.mode ?? (config?.offlineDemo ? 'SAVED_DEMO' : 'LIVE_READ_ONLY');
  const contextLine = config?.offlineDemo
    ? 'Saved evidence mode · no fresh network execution'
    : pgConfig?.liveAuthorized
      ? 'Live analysis enabled · chain writes authorized on this operator host'
      : 'Live analysis enabled · chain writes require authorization';

  const drawer = (
    <Sidebar
      collapsed={!mobile && collapsed}
      onToggleCollapse={() => setCollapsed((v) => !v)}
      mode={String(mode)}
    />
  );

  return (
    <AppContext.Provider value={{ config, pgConfig, refresh: async () => {
      const [c, p] = await Promise.all([api.config() as Promise<AppConfig>, api.playground.config() as Promise<PlaygroundConfig>]);
      setConfig(c); setPgConfig(p);
    } }}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        {mobile ? (
          <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width: DRAWER } }}>
            {drawer}
          </Drawer>
        ) : (
          <Drawer variant="permanent" open sx={{ width, flexShrink: 0, '& .MuiDrawer-paper': { width, boxSizing: 'border-box', transition: 'width .2s ease' } }}>
            {drawer}
          </Drawer>
        )}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: `1px solid ${tokens.border}`, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>
            <Toolbar sx={{ gap: 1.5, minHeight: 64 }}>
              {mobile && (
                <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={18} /></IconButton>
              )}
              {!mobile && (
                <IconButton onClick={() => setCollapsed((v) => !v)} aria-label="Collapse sidebar">
                  {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </IconButton>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h3" noWrap>{page.label}</Typography>
                <Typography variant="body2" noWrap>{contextLine}</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={config?.offlineDemo ? 'Arkiv Rabdi · offline' : 'EF Devnet 1337'} variant="outlined" />
                <Chip size="small" color={pgConfig?.liveAuthorized ? 'success' : 'default'} label={String(mode)} variant={pgConfig?.liveAuthorized ? 'filled' : 'outlined'} />
                <Chip size="small" color={error ? 'error' : 'success'} label={error ? 'API error' : 'Backend connected'} variant="outlined" />
              </Stack>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>
            {error && <Alert severity="warning" sx={{ mb: 2 }}>Dashboard config: {error}. Analysis may still work if playground APIs respond.</Alert>}
            <Outlet />
          </Box>
        </Box>
      </Box>
    </AppContext.Provider>
  );
}
