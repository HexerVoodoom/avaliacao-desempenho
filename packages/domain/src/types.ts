// ============================================================================
// Domain types — shared between apps/client-app, apps/studio-admin and
// packages/supabase. This is the single source of truth for the data model
// described in docs/PLANO (organizations, roles, competencies, evaluations).
// ============================================================================

export type UUID = string;
export type ISODateString = string;

// ---------------------------------------------------------------------------
// Organizations (tenants) & membership
// ---------------------------------------------------------------------------

export interface DesignTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  colorSurface: string;
  colorSurfaceMuted: string;
  colorTextPrimary: string;
  colorTextMuted: string;
  fontFamily: string;
  radiusBase: string; // e.g. "8px"
  logoUrlLight?: string;
  logoUrlDark?: string;
  faviconUrl?: string;
  density: 'compact' | 'comfortable';
}

export interface Organization {
  id: UUID;
  slug: string;
  name: string;
  designTokens: DesignTokens;
  /** Which of the 3 evaluation methods this org has enabled. */
  enabledEvaluationTypes: EvaluationType[];
  /** Custom role-type taxonomy for this org, e.g. ["liderança", "associado", "terceirizado"]. */
  roleTypes: string[];
  createdAt: ISODateString;
}

export type OrgUserRole = 'owner' | 'admin_rh' | 'avaliador';

export interface Membership {
  userId: UUID;
  organizationId: UUID;
  role: OrgUserRole;
}

// ---------------------------------------------------------------------------
// Competencies — GLOBAL library, shared across every organization
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  color: string;
}

export type QuestionType = 'statement' | 'dialogic';

export interface CompetencyQuestion {
  id: UUID;
  competencyId: UUID;
  type: QuestionType;
  text: string;
  order: number;
}

export interface Competency {
  id: UUID;
  categoryId: string;
  name: string;
  description?: string;
  questions: CompetencyQuestion[];
  order: number;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Roles — per organization
// ---------------------------------------------------------------------------

export interface RoleActivity {
  id: UUID;
  roleId: UUID;
  text: string;
  order: number;
}

/** Junction: which competencies (and which specific questions within them)
 * apply to a role. This is the "atribuir uma coisa à outra" link. */
export interface RoleCompetencyLink {
  roleId: UUID;
  competencyId: UUID;
  /** Subset of CompetencyQuestion.id selected for this role. Empty = none selected. */
  selectedQuestionIds: UUID[];
}

export interface Role {
  id: UUID;
  organizationId: UUID;
  name: string;
  /** Free-form tag drawn from Organization.roleTypes (e.g. "liderança", "associado"). */
  type: string;
  activities: RoleActivity[];
  competencyLinks: RoleCompetencyLink[];
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Members — per organization
// ---------------------------------------------------------------------------

export type DatePrecision = 'year' | 'month' | 'day';

export interface PartialDate {
  /** Normalized ISO date (day defaults to 1 when precision is 'year'/'month'). */
  value: ISODateString;
  precision: DatePrecision;
}

export interface Member {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName?: string;
  birthDate?: PartialDate;
  startDate?: PartialDate;
  roleId: UUID;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

export type EvaluationType = 'dialogica' | 'tradicional' | 'atividades';
export type EvaluationStatus = 'in_progress' | 'completed';

/** 1–5 scale, meaning depends on EvaluationType (see scales.ts). */
export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export interface EvaluationResponse {
  id: UUID;
  evaluationId: UUID;
  /** competencyQuestion.id for dialogica/tradicional, roleActivity.id for atividades. */
  targetId: UUID;
  score: ScoreValue;
  /** Only used in "dialogica": up to 3 keywords captured from the open answer. */
  keywords?: [string?, string?, string?];
}

export interface EvaluationSectionNote {
  id: UUID;
  evaluationId: UUID;
  categoryId: string;
  observation?: string;
  /** "What to do to improve" or "what to do to maintain", decided by score threshold. */
  improvementAction?: string;
}

export interface Evaluation {
  id: UUID;
  organizationId: UUID;
  type: EvaluationType;
  status: EvaluationStatus;
  evaluatorMemberId: UUID;
  evaluateeMemberId: UUID;
  roleId: UUID;
  responses: EvaluationResponse[];
  sectionNotes: EvaluationSectionNote[];
  createdAt: ISODateString;
  completedAt?: ISODateString;
}

// ---------------------------------------------------------------------------
// Derived / computed view models (not persisted)
// ---------------------------------------------------------------------------

export interface CategoryScoreSummary {
  categoryId: string;
  categoryName: string;
  averageScore: number;
  questionCount: number;
  responses: EvaluationResponse[];
}

export interface EvaluationSummary {
  evaluation: Evaluation;
  overallAverage: number;
  byCategory: CategoryScoreSummary[];
}
