import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './theme/theme';
import { AppShell } from './layout/AppShell';
import { OverviewPage } from './pages/Overview';
import { PlaygroundPage } from './pages/Playground';
import { ComparisonsPage } from './pages/Comparisons';
import { CampaignsPage } from './pages/Campaigns';
import { EvidencePage } from './pages/Evidence';
import { AgentsPage } from './pages/Agents';
import { ArkivPage } from './pages/Arkiv';
import { ReadinessPage } from './pages/Readiness';
import { BriefingPage } from './pages/Briefing';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="comparisons" element={<ComparisonsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="evidence" element={<EvidencePage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="arkiv" element={<ArkivPage />} />
            <Route path="readiness" element={<ReadinessPage />} />
            <Route path="briefing" element={<BriefingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
