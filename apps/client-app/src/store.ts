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
  if (existing) {
    await ensureSeedData(existing.id);
    return existing;
  }
  if (!inFlight) inFlight = createDefaultOrganization();
  const org = await inFlight;
  await ensureSeedData(org.id);
  return org;
}

let seedInFlight: Promise<void> | null = null;

/** A fresh demo instance otherwise starts with zero roles/members, which
 * blocks every other screen (Members requires a Role, Evaluations require a
 * Member) — annoying friction for whitelabel validation testing. Seeds one
 * "CEO" role + one "UserAlpha" member the first time there are none, and is
 * a no-op forever after (never overwrites/duplicates once real data exists). */
async function ensureSeedData(organizationId: string) {
  if (!seedInFlight) seedInFlight = seedDefaultRoleAndMember(organizationId);
  return seedInFlight;
}

async function seedDefaultRoleAndMember(organizationId: string) {
  const roles = await store.roles.list(organizationId);
  const ceoRole =
    roles.find((r) => r.name === 'CEO') ??
    (await store.roles.create({
      organizationId,
      name: 'CEO',
      type: 'liderança',
      activities: [],
      competencyLinks: [],
    }));

  const members = await store.members.list(organizationId);
  if (!members.some((m) => m.firstName === 'UserAlpha')) {
    await store.members.create({
      organizationId,
      firstName: 'UserAlpha',
      roleId: ceoRole.id,
    });
  }
}

async function createDefaultOrganization() {
  return store.organizations.create({
    slug: DEFAULT_ORG_SLUG,
    name: 'Minha Organização',
    designTokens: {
      // Kept in sync with apps/studio-admin's DEFAULT_PALETTE — every value
      // here passes its own WCAG AA check (see packages/ui/src/lib/contrast.ts).
      colorPrimary: '#6155f5',
      colorSecondary: '#0f766e',
      colorSuccess: '#15803d',
      colorWarning: '#b45309',
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
