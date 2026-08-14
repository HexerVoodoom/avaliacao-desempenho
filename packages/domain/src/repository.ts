import type {
  Category,
  Competency,
  Evaluation,
  Member,
  Organization,
  Role,
} from './types';

// ============================================================================
// Repository ports — the app talks to these interfaces, never to a specific
// backend. Today the only implementation is @studio/local-store
// (browser localStorage); a @studio/supabase-store implementing the same
// interface is a drop-in swap once the hosted project is approved. See
// docs/PLANO.md §7 for the current status of that decision.
// ============================================================================

export interface RoleFilters {
  type?: string;
  search?: string;
}

export interface EvaluationFilters {
  memberId?: string;
  evaluatorId?: string;
  type?: Evaluation['type'];
  status?: Evaluation['status'];
  from?: string; // ISO date
  to?: string; // ISO date
}

export interface NewCompetencyInput {
  categoryId: string;
  name: string;
  description?: string;
  /** Exactly one dialogic question ("base de diálogo") + N statements ("afirmações técnicas"). */
  dialogicText: string;
  statementTexts: string[];
}

export interface CompetencyLibrary {
  listCategories(): Promise<Category[]>;
  listCompetencies(): Promise<Competency[]>;
  /** Competencies are global (docs/PLANO.md §2) — adding one here makes it
   * available to every organization's Cargos accordion immediately. */
  addCompetency(input: NewCompetencyInput): Promise<Competency>;
  /** Edits a competency's name/category/dialogic question/statements —
   * including ones from the seed library, not just user-created ones. */
  updateCompetency(id: string, input: NewCompetencyInput): Promise<Competency>;
}

export interface OrganizationRepository {
  get(id: string): Promise<Organization | null>;
  getBySlug(slug: string): Promise<Organization | null>;
  list(): Promise<Organization[]>;
  create(input: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization>;
  update(id: string, patch: Partial<Omit<Organization, 'id'>>): Promise<Organization>;
}

export interface RoleRepository {
  list(organizationId: string, filters?: RoleFilters): Promise<Role[]>;
  get(id: string): Promise<Role | null>;
  create(input: Omit<Role, 'id' | 'createdAt'>): Promise<Role>;
  update(id: string, patch: Partial<Omit<Role, 'id' | 'organizationId'>>): Promise<Role>;
  remove(id: string): Promise<void>;
}

export interface MemberRepository {
  list(organizationId: string): Promise<Member[]>;
  get(id: string): Promise<Member | null>;
  create(input: Omit<Member, 'id' | 'createdAt'>): Promise<Member>;
  update(id: string, patch: Partial<Omit<Member, 'id' | 'organizationId'>>): Promise<Member>;
  remove(id: string): Promise<void>;
}

export interface EvaluationRepository {
  list(organizationId: string, filters?: EvaluationFilters): Promise<Evaluation[]>;
  get(id: string): Promise<Evaluation | null>;
  create(input: Omit<Evaluation, 'id' | 'createdAt'>): Promise<Evaluation>;
  update(id: string, patch: Partial<Omit<Evaluation, 'id' | 'organizationId'>>): Promise<Evaluation>;
  remove(id: string): Promise<void>;
}

export interface StudioStore {
  competencyLibrary: CompetencyLibrary;
  organizations: OrganizationRepository;
  roles: RoleRepository;
  members: MemberRepository;
  evaluations: EvaluationRepository;
}
