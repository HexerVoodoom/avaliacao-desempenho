import { Button } from '@studio/ui';

/**
 * Placeholder do Studio-admin — onboarding de clientes (upload de design.md,
 * import de membros/cargos, preview de tema) chega na Fase 2/6 do plano.
 */
export function App() {
  return (
    <main style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Studio Admin</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Onboarding de clientes (design.md, import de dados, preview de tema) — Fase 2.
      </p>
      <Button variant="primary">Novo cliente</Button>
    </main>
  );
}
