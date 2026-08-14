import * as React from 'react';
import type { Organization } from '@studio/domain';
import { ensureDefaultOrganization } from './store';
import { MembersPage } from './pages/MembersPage';
import { RolesPage } from './pages/RolesPage';
import { CompetenciesPage } from './pages/CompetenciesPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ManualPage } from './pages/ManualPage';
import { FileMenu } from './FileMenu';

type Tab = 'members' | 'roles' | 'competencies' | 'evaluations' | 'history' | 'manual';

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
  const [tab, setTab] = React.useState<Tab>('evaluations');

  React.useEffect(() => {
    ensureDefaultOrganization().then(setOrganization);
  }, []);

  if (!organization) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[length:var(--font-size-md)] text-[var(--color-text-muted)]">
        Carregando…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <nav className="flex w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-4)] py-[var(--space-6)]">
        {/* Whitelabel logo slot: Organization.designTokens.logoUrlLight/Dark
            would render here instead of the plain name — out of scope for
            this structural pass. */}
        <div className="mb-[var(--space-6)] truncate text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)] text-[var(--color-text-primary)]">
          {organization.name}
        </div>

        <ul className="flex flex-1 flex-col gap-[var(--space-1)] list-none p-0 m-0">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'w-full text-left rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)]',
                    'text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)]',
                    'border-l-[3px] transition-colors',
                    'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
                    active
                      ? 'border-l-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-l-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-[var(--space-6)] border-t border-[var(--color-border)] pt-[var(--space-4)]">
          <div className="mb-[var(--space-2)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[var(--color-text-muted)]">
            Arquivo
          </div>
          <FileMenu />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[960px] px-[var(--space-8)] py-[var(--space-8)]">
          {tab === 'evaluations' && <EvaluationsPage organization={organization} />}
          {tab === 'history' && <HistoryPage organization={organization} />}
          {tab === 'members' && <MembersPage organization={organization} />}
          {tab === 'roles' && <RolesPage organization={organization} />}
          {tab === 'competencies' && <CompetenciesPage />}
          {tab === 'manual' && <ManualPage />}
        </div>
      </main>
    </div>
  );
}
