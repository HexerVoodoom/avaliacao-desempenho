import * as React from 'react';
import type { Organization } from '@studio/domain';
import { Button } from '@studio/ui';
import { ensureDefaultOrganization } from './store';
import { MembersPage } from './pages/MembersPage';
import { RolesPage } from './pages/RolesPage';

type Tab = 'members' | 'roles';

const TABS: { id: Tab; label: string }[] = [
  { id: 'members', label: 'Membros' },
  { id: 'roles', label: 'Cargos' },
];

export function App() {
  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [tab, setTab] = React.useState<Tab>('members');

  React.useEffect(() => {
    ensureDefaultOrganization().then(setOrganization);
  }, []);

  if (!organization) {
    return <main style={{ padding: 32 }}>Carregando…</main>;
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
        {tab === 'members' && <MembersPage organization={organization} />}
        {tab === 'roles' && <RolesPage organization={organization} />}
      </main>
    </div>
  );
}
