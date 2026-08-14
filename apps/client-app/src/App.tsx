import * as React from 'react';
import type { Organization } from '@studio/domain';
import { Button } from '@studio/ui';
import { ensureDefaultOrganization } from './store';
import { HomePage } from './pages/HomePage';
import { MembersPage } from './pages/MembersPage';
import { RolesPage } from './pages/RolesPage';
import { CompetenciesPage } from './pages/CompetenciesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ManualPage } from './pages/ManualPage';

type Tab = 'home' | 'members' | 'roles' | 'competencies' | 'evaluations' | 'history' | 'manual';

const TABS: { id: Tab; label: string }[] = [
  { id: 'evaluations', label: 'Avaliações' },
  { id: 'history', label: 'Histórico' },
  { id: 'members', label: 'Membros' },
  { id: 'roles', label: 'Cargos' },
  { id: 'competencies', label: 'Competências' },
  { id: 'manual', label: 'Manual de uso' },
];

export function App() {
  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [tab, setTab] = React.useState<Tab>('home');

  React.useEffect(() => {
    ensureDefaultOrganization().then(setOrganization);
  }, []);

  if (!organization) {
    return <main style={{ padding: 32 }}>Carregando…</main>;
  }

  if (tab === 'home') {
    return (
      <HomePage
        organization={organization}
        onNavigate={(target) => {
          if (target === 'newEvaluation' || target === 'savedEvaluations') {
            setTab(target === 'newEvaluation' ? 'evaluations' : 'history');
          } else {
            setTab(target);
          }
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav
        style={{
          width: 200,
          borderRight: '1px solid var(--color-border)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 16 }}>{organization.name}</div>
        <Button variant="ghost" onClick={() => setTab('home')} style={{ justifyContent: 'flex-start' }}>
          ← Início
        </Button>
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'primary' : 'ghost'}
            onClick={() => setTab(t.id)}
            style={{ justifyContent: 'flex-start' }}
          >
            {t.label}
          </Button>
        ))}
      </nav>
      <main style={{ flex: 1, padding: 32 }}>
        {tab === 'evaluations' && <EvaluationsPage organization={organization} />}
        {tab === 'history' && <HistoryPage organization={organization} />}
        {tab === 'members' && <MembersPage organization={organization} />}
        {tab === 'roles' && <RolesPage organization={organization} />}
        {tab === 'competencies' && <CompetenciesPage />}
        {tab === 'manual' && <ManualPage />}
      </main>
    </div>
  );
}
