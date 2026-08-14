import { createLocalStore } from '@studio/local-store';

/**
 * Singleton local store for this browser. See docs/PLANO.md §7 — persistence
 * is local-only until the Supabase project decision is made; swapping later
 * means creating a @studio/supabase-store that implements the same
 * StudioStore interface (packages/domain/src/repository.ts) and importing it
 * here instead.
 */
export const store = createLocalStore();

const DEFAULT_ORG_SLUG = 'default';

/** Client-app currently runs as a single-tenant demo instance: it works
 * against one organization, created on first load if none exists yet.
 * Studio-admin's organizations run in a separate browser origin during dev
 * (different port), so they intentionally don't share this org today —
 * multi-org switching in client-app is Fase 6+ (Studio-admin polish). */
let inFlight: ReturnType<typeof createDefaultOrganization> | null = null;

export async function ensureDefaultOrganization() {
  // React 18 StrictMode double-invokes effects on mount in dev, which was
  // firing this twice concurrently: both calls saw "no org yet" (neither had
  // written back before the other checked) and each created one, leaving two
  // orgs with slug 'default' — the member form and the members list would
  // then silently disagree on which org they were talking to. Caching the
  // in-flight promise makes concurrent callers await the same creation
  // instead of racing.
  const existing = await store.organizations.getBySlug(DEFAULT_ORG_SLUG);
  if (existing) return existing;
  if (!inFlight) inFlight = createDefaultOrganization();
  return inFlight;
}

async function createDefaultOrganization() {
  return store.organizations.create({
    slug: DEFAULT_ORG_SLUG,
    name: 'Minha Organização',
    designTokens: {
      colorPrimary: '#6155f5',
      colorSecondary: '#34d399',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorDanger: '#ef4444',
      colorSurface: '#ffffff',
      colorSurfaceMuted: '#f4f4f6',
      colorTextPrimary: '#111114',
      colorTextMuted: '#6b6b76',
      fontFamily: 'Inter, system-ui, sans-serif',
      radiusBase: '10px',
      density: 'comfortable',
    },
    enabledEvaluationTypes: ['dialogica', 'tradicional', 'atividades'],
    roleTypes: ['liderança', 'associado'],
  });
}
