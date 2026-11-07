import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary">FrameFuzz</Typography>
        <Typography variant="h1">{title}</Typography>
        {subtitle && <Typography variant="body2" sx={{ mt: 0.75, maxWidth: 720 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Stack>
  );
}
