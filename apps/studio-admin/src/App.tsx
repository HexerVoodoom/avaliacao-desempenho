import { NewOrganizationForm, type NewOrganizationPayload } from './NewOrganizationForm';

/**
 * Onboarding de clientes (Fase 2). Persistência real em Supabase fica
 * pendente até o projeto hospedado ser aprovado — ver nota em
 * NewOrganizationForm.tsx. Por ora, o payload validado só é logado.
 */
export function App() {
  function handleSubmit(payload: NewOrganizationPayload) {
    // eslint-disable-next-line no-console
    console.log('organização pronta para publicar (Supabase pendente):', payload);
  }

  return (
    <main style={{ padding: 32, maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Studio Admin — Novo cliente</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Implementa docs/design.md.template como formulário, com validador de contraste WCAG AA ao vivo.
      </p>
      <NewOrganizationForm onSubmit={handleSubmit} />
    </main>
  );
}
