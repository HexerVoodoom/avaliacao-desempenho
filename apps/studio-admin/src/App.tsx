import * as React from 'react';
import { createLocalStore } from '@studio/local-store';
import type { Organization } from '@studio/domain';
import { NewOrganizationForm, type NewOrganizationPayload } from './NewOrganizationForm';
import { Button } from '@studio/ui';

/**
 * Onboarding de clientes (Fase 2). Persistência real hoje é local
 * (localStorage, via @studio/local-store) — o projeto Supabase hospedado
 * segue pendente de decisão de custo (ver docs/PLANO.md §7). A troca para
 * Supabase, quando decidida, é só trocar createLocalStore() por
 * createSupabaseStore(): o resto do app fala com a interface StudioStore,
 * não com o backend diretamente.
 */
const store = createLocalStore();

export function App() {
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    store.organizations.list().then(setOrganizations);
  }, []);

  async function handleSubmit(payload: NewOrganizationPayload) {
    const org = await store.organizations.create({
      name: payload.name,
      slug: payload.slug,
      designTokens: {
        colorPrimary: payload.palette.colorPrimary,
        colorSecondary: payload.palette.colorSecondary,
        colorSuccess: payload.palette.colorSuccess,
        colorWarning: payload.palette.colorWarning,
        colorDanger: payload.palette.colorDanger,
        colorSurface: payload.palette.colorSurface,
        colorSurfaceMuted: payload.palette.colorSurfaceMuted,
        colorTextPrimary: payload.palette.colorTextPrimary,
        colorTextMuted: payload.palette.colorTextMuted,
        fontFamily: payload.fontFamily,
        radiusBase: payload.radiusBase,
        logoUrlLight: payload.logoUrl,
        density: 'comfortable',
      },
      enabledEvaluationTypes: payload.enabledEvaluationTypes,
      roleTypes: payload.roleTypes,
    });
    setOrganizations((prev) => [...prev, org]);
    setCreating(false);
  }

  return (
    <main style={{ padding: 32, maxWidth: creating ? 860 : 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Studio Admin</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Dados salvos localmente neste navegador por enquanto (localStorage) — ver docs/PLANO.md §7.
      </p>

      {!creating && (
        <>
          <Button variant="primary" onClick={() => setCreating(true)}>
            Novo cliente
          </Button>
          <ul style={{ marginTop: 24, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {organizations.map((org) => (
              <li
                key={org.id}
                style={{
                  padding: 12,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-base)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {org.designTokens.logoUrlLight && (
                    <img src={org.designTokens.logoUrlLight} alt="" style={{ height: 20 }} />
                  )}
                  {org.name}
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>/{org.slug}</span>
              </li>
            ))}
            {organizations.length === 0 && (
              <li style={{ color: 'var(--color-text-muted)' }}>Nenhum cliente cadastrado ainda.</li>
            )}
          </ul>
        </>
      )}

      {creating && <NewOrganizationForm onSubmit={handleSubmit} />}
    </main>
  );
}
