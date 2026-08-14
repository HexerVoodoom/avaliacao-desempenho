import { Button, Badge } from '@studio/ui';
import { SCALE_LABELS } from '@studio/domain';

/**
 * Placeholder de boot do client-app — prova que packages/ui e
 * packages/domain resolvem corretamente dentro do monorepo e que os tokens
 * de tema (tokens.css) estão sendo aplicados. As telas reais (Membros,
 * Cargos, Competências, Avaliações) chegam nas Fases 3–5 do plano.
 */
export function App() {
  return (
    <main style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Studio — Avaliação de Desempenho</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Fundação do monorepo (Fase 0) e design system base (Fase 1) no ar.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Badge tone="primary">liderança</Badge>
        <Badge tone="neutral">associado</Badge>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button variant="primary">Nova avaliação</Button>
      </div>
      <ul style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>
        {Object.entries(SCALE_LABELS.dialogica).map(([score, label]) => (
          <li key={score}>
            {score} — {label}
          </li>
        ))}
      </ul>
    </main>
  );
}
