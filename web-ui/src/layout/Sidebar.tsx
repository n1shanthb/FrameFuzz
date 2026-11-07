import { NavLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import { NAV } from './nav';
import { tokens } from '../theme/tokens';

export function Sidebar({ collapsed, mode }: { collapsed: boolean; onToggleCollapse?: () => void; mode: string }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: tokens.surface }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: collapsed ? 1.5 : 2, py: 2.25 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: tokens.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, flexShrink: 0 }}>
          F
        </Box>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>FrameFuzz</Typography>
            <Typography variant="body2" noWrap sx={{ fontSize: 11 }}>EIP-8141 admission lab</Typography>
          </Box>
        )}
      </Stack>
      <List sx={{ px: 1, flex: 1 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const btn = (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&.active': { bgcolor: tokens.primarySoft, color: tokens.primary, '& .MuiListItemIcon-root': { color: tokens.primary } },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'text.secondary', justifyContent: 'center' }}>
                <Icon size={18} />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: 550 }} />}
            </ListItemButton>
          );
          return collapsed ? <Tooltip key={item.to} title={item.label} placement="right">{btn}</Tooltip> : btn;
        })}
      </List>
      {!collapsed && (
        <Box sx={{ p: 2, borderTop: `1px solid ${tokens.border}` }}>
          <Typography variant="overline">Runtime</Typography>
          <Typography variant="body2" sx={{ fontFamily: tokens.mono, fontSize: 11 }}>{mode}</Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: 11 }}>No broadcast from navigation.</Typography>
        </Box>
      )}
    </Box>
  );
}
