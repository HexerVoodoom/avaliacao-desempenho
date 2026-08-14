import type {
  Competency,
  CompetencyLibrary,
  Evaluation,
  EvaluationFilters,
  EvaluationRepository,
  Member,
  MemberRepository,
  NewCompetencyInput,
  Organization,
  OrganizationRepository,
  Role,
  RoleFilters,
  RoleRepository,
  StudioStore,
} from '@studio/domain';
import { Collection, newId } from './collection';
import { CATEGORIES, COMPETENCIES } from './competency-library.data';

const KEYS = {
  organizations: 'studio:organizations',
  roles: 'studio:roles',
  members: 'studio:members',
  evaluations: 'studio:evaluations',
  customCompetencies: 'studio:custom-competencies',
} as const;

/** Static (seed) competencies + anything created in-app via addCompetency,
 * layered together so "global library" behaves the same whether an entry
 * came from the seed or from a user. */
class StaticCompetencyLibrary implements CompetencyLibrary {
  private custom = new Collection<Competency>(KEYS.customCompetencies);

  async listCategories() {
    return CATEGORIES;
  }
  async listCompetencies() {
    const customOnes = await this.custom.all();
    return [...COMPETENCIES, ...customOnes];
  }
  async addCompetency(input: NewCompetencyInput) {
    const competencyId = newId();
    const competency: Competency = {
      id: competencyId,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      order: 1000 + Date.now() % 1000, // sorts after the seed library
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: newId(),
          competencyId,
          type: 'dialogic',
          text: input.dialogicText,
          order: 0,
        },
        ...input.statementTexts.map((text, i) => ({
          id: newId(),
          competencyId,
          type: 'statement' as const,
          text,
          order: i + 1,
        })),
      ],
    };
    return this.custom.insert(competency);
  }
}

class LocalOrganizationRepository implements OrganizationRepository {
  private col = new Collection<Organization>(KEYS.organizations);

  async get(id: string) {
    return this.col.byId(id);
  }
  async getBySlug(slug: string) {
    const all = await this.col.all();
    return all.find((o) => o.slug === slug) ?? null;
  }
  async list() {
    return this.col.all();
  }
  async create(input: Omit<Organization, 'id' | 'createdAt'>) {
    const org: Organization = { ...input, id: newId(), createdAt: new Date().toISOString() };
    return this.col.insert(org);
  }
  async update(id: string, patch: Partial<Omit<Organization, 'id'>>) {
    return this.col.patch(id, patch);
  }
}

class LocalRoleRepository implements RoleRepository {
  private col = new Collection<Role>(KEYS.roles);

  async list(organizationId: string, filters?: RoleFilters) {
    let items = (await this.col.all()).filter((r) => r.organizationId === organizationId);
    if (filters?.type) items = items.filter((r) => r.type === filters.type);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((r) => r.name.toLowerCase().includes(q));
    }
    return items;
  }
  async get(id: string) {
    return this.col.byId(id);
  }
  async create(input: Omit<Role, 'id' | 'createdAt'>) {
    const role: Role = { ...input, id: newId(), createdAt: new Date().toISOString() };
    return this.col.insert(role);
  }
  async update(id: string, patch: Partial<Omit<Role, 'id' | 'organizationId'>>) {
    return this.col.patch(id, patch);
  }
  async remove(id: string) {
    return this.col.delete(id);
  }
}

class LocalMemberRepository implements MemberRepository {
  private col = new Collection<Member>(KEYS.members);

  async list(organizationId: string) {
    return (await this.col.all()).filter((m) => m.organizationId === organizationId);
  }
  async get(id: string) {
    return this.col.byId(id);
  }
  async create(input: Omit<Member, 'id' | 'createdAt'>) {
    const member: Member = { ...input, id: newId(), createdAt: new Date().toISOString() };
    return this.col.insert(member);
  }
  async update(id: string, patch: Partial<Omit<Member, 'id' | 'organizationId'>>) {
    return this.col.patch(id, patch);
  }
  async remove(id: string) {
    return this.col.delete(id);
  }
}

class LocalEvaluationRepository implements EvaluationRepository {
  private col = new Collection<Evaluation>(KEYS.evaluations);

  async list(organizationId: string, filters?: EvaluationFilters) {
    let items = (await this.col.all()).filter((e) => e.organizationId === organizationId);
    if (filters?.memberId) items = items.filter((e) => e.evaluateeMemberId === filters.memberId);
    if (filters?.evaluatorId) items = items.filter((e) => e.evaluatorMemberId === filters.evaluatorId);
    if (filters?.type) items = items.filter((e) => e.type === filters.type);
    if (filters?.status) items = items.filter((e) => e.status === filters.status);
    if (filters?.from) items = items.filter((e) => e.createdAt >= filters.from!);
    if (filters?.to) items = items.filter((e) => e.createdAt <= filters.to!);
    return items;
  }
  async get(id: string) {
    return this.col.byId(id);
  }
  async create(input: Omit<Evaluation, 'id' | 'createdAt'>) {
    const evaluation: Evaluation = { ...input, id: newId(), createdAt: new Date().toISOString() };
    return this.col.insert(evaluation);
  }
  async update(id: string, patch: Partial<Omit<Evaluation, 'id' | 'organizationId'>>) {
    return this.col.patch(id, patch);
  }
  async remove(id: string) {
    return this.col.delete(id);
  }
}

/** The only implementation of StudioStore today. See packages/domain/src/repository.ts
 * for the interface every app codes against — a future @studio/supabase-store
 * swaps in without touching app code. */
export function createLocalStore(): StudioStore {
  return {
    competencyLibrary: new StaticCompetencyLibrary(),
    organizations: new LocalOrganizationRepository(),
    roles: new LocalRoleRepository(),
    members: new LocalMemberRepository(),
    evaluations: new LocalEvaluationRepository(),
  };
}

export interface StoreSnapshot {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Dumps every localStorage-backed collection (organizations, roles, members,
 * evaluations, custom competencies) into one JSON-serializable snapshot, for
 * the Arquivo > Salvar flow — this app has no backend, so a downloaded JSON
 * file is the only durable save format. */
export function exportSnapshot(): StoreSnapshot {
  const data: Record<string, unknown> = {};
  for (const key of Object.values(KEYS)) {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    data[key] = raw ? JSON.parse(raw) : [];
  }
  return { version: 1, exportedAt: new Date().toISOString(), data };
}

/** Replaces every localStorage-backed collection with the contents of a
 * snapshot produced by exportSnapshot — the Arquivo > Carregar flow. Keys
 * absent from the snapshot are left untouched rather than cleared, so
 * partial/older snapshots don't wipe unrelated data. */
export function importSnapshot(snapshot: StoreSnapshot): void {
  if (typeof localStorage === 'undefined') return;
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.data) {
    throw new Error('Arquivo inválido: não contém dados reconhecíveis do Studio.');
  }
  for (const key of Object.values(KEYS)) {
    if (key in snapshot.data) {
      localStorage.setItem(key, JSON.stringify(snapshot.data[key]));
    }
  }
}
