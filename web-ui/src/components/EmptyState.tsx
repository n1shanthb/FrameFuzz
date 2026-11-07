import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#FCFDFE' }}>
      <Stack spacing={1.5} alignItems="center">
        {icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>}
        <Typography variant="h3">{title}</Typography>
        <Typography variant="body2" sx={{ maxWidth: 480 }}>{body}</Typography>
        {action}
      </Stack>
    </Paper>
  );
}
