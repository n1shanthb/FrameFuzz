import {
  LayoutDashboard, Code2, GitCompareArrows, FlaskConical, FileSearch,
  BrainCircuit, Database, Activity, BookOpen,
} from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/playground', label: 'Contract Playground', icon: Code2 },
  { to: '/comparisons', label: 'Admission Comparisons', icon: GitCompareArrows },
  { to: '/campaigns', label: 'Test Campaigns', icon: FlaskConical },
  { to: '/evidence', label: 'Evidence Explorer', icon: FileSearch },
  { to: '/agents', label: 'Agent Swarm', icon: BrainCircuit },
  { to: '/arkiv', label: 'Arkiv Registry', icon: Database },
  { to: '/readiness', label: 'Live Readiness', icon: Activity },
  { to: '/briefing', label: 'Technical Briefing', icon: BookOpen },
] as const;
