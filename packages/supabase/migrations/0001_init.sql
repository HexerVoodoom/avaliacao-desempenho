-- ============================================================================
-- Studio de Avaliação de Desempenho — schema inicial (Fase 0)
-- Multi-tenant: toda tabela de negócio carrega organization_id e é protegida
-- por RLS. `competencies`/`categories` são GLOBAIS (biblioteca compartilhada).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organizations & membership
-- ---------------------------------------------------------------------------

create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  design_tokens jsonb not null default '{}'::jsonb,
  enabled_evaluation_types text[] not null default array['dialogica','tradicional','atividades'],
  role_types text[] not null default array['liderança','associado'],
  created_at timestamptz not null default now()
);

create type org_user_role as enum ('owner', 'admin_rh', 'avaliador');

create table memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role org_user_role not null default 'avaliador',
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

-- helper: does the current auth.uid() belong to this organization?
create or replace function is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where organization_id = org_id and user_id = auth.uid()
      and role in ('owner', 'admin_rh')
  );
$$;

alter table organizations enable row level security;
alter table memberships enable row level security;

create policy "org members can read their org" on organizations
  for select using (is_org_member(id));
create policy "org admins can update their org" on organizations
  for update using (is_org_admin(id));

create policy "members can read their own memberships" on memberships
  for select using (user_id = auth.uid() or is_org_admin(organization_id));
create policy "org admins manage memberships" on memberships
  for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- Competency library — GLOBAL (no organization_id, readable by any
-- authenticated member of any organization; write restricted to service role
-- / studio-admin superusers only, enforced by NOT granting insert/update to
-- the anon/authenticated roles here — studio-admin uses the service key).
-- ---------------------------------------------------------------------------

create table categories (
  id text primary key,
  name text not null,
  description text not null default '',
  "order" integer not null default 0,
  color text not null default '#6155f5'
);

create table competencies (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references categories(id),
  name text not null,
  description text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create type question_type as enum ('statement', 'dialogic');

create table competency_questions (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references competencies(id) on delete cascade,
  type question_type not null,
  text text not null,
  "order" integer not null default 0
);

alter table categories enable row level security;
alter table competencies enable row level security;
alter table competency_questions enable row level security;

create policy "any authenticated user can read categories" on categories
  for select to authenticated using (true);
create policy "any authenticated user can read competencies" on competencies
  for select to authenticated using (true);
create policy "any authenticated user can read competency_questions" on competency_questions
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Roles — per organization
-- ---------------------------------------------------------------------------

create table roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table role_activities (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete cascade,
  text text not null,
  "order" integer not null default 0
);

create table role_competencies (
  role_id uuid not null references roles(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  selected_question_ids uuid[] not null default '{}',
  primary key (role_id, competency_id)
);

alter table roles enable row level security;
alter table role_activities enable row level security;
alter table role_competencies enable row level security;

create policy "org members read roles" on roles
  for select using (is_org_member(organization_id));
create policy "org admins manage roles" on roles
  for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

create policy "org members read role_activities" on role_activities
  for select using (is_org_member((select organization_id from roles where roles.id = role_id)));
create policy "org admins manage role_activities" on role_activities
  for all using (is_org_admin((select organization_id from roles where roles.id = role_id)))
  with check (is_org_admin((select organization_id from roles where roles.id = role_id)));

create policy "org members read role_competencies" on role_competencies
  for select using (is_org_member((select organization_id from roles where roles.id = role_id)));
create policy "org admins manage role_competencies" on role_competencies
  for all using (is_org_admin((select organization_id from roles where roles.id = role_id)))
  with check (is_org_admin((select organization_id from roles where roles.id = role_id)));

-- ---------------------------------------------------------------------------
-- Members — per organization
-- ---------------------------------------------------------------------------

create type date_precision as enum ('year', 'month', 'day');

create table members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text not null,
  last_name text,
  birth_date date,
  birth_date_precision date_precision,
  start_date date,
  start_date_precision date_precision,
  role_id uuid not null references roles(id),
  created_at timestamptz not null default now()
);

alter table members enable row level security;

create policy "org members read members" on members
  for select using (is_org_member(organization_id));
create policy "org admins manage members" on members
  for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- Evaluations — per organization
-- ---------------------------------------------------------------------------

create type evaluation_type as enum ('dialogica', 'tradicional', 'atividades');
create type evaluation_status as enum ('in_progress', 'completed');

create table evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type evaluation_type not null,
  status evaluation_status not null default 'in_progress',
  evaluator_member_id uuid not null references members(id),
  evaluatee_member_id uuid not null references members(id),
  role_id uuid not null references roles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  -- competency_question.id (dialogica/tradicional) or role_activity.id (atividades)
  target_id uuid not null,
  score smallint not null check (score between 1 and 5),
  keywords text[]
);

create table evaluation_section_notes (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references evaluations(id) on delete cascade,
  category_id text not null references categories(id),
  observation text,
  improvement_action text
);

alter table evaluations enable row level security;
alter table evaluation_responses enable row level security;
alter table evaluation_section_notes enable row level security;

-- NOTE (ProdSquad security-architect finding, severity Alto): the original
-- "for all" policy let ANY org member — including the 'avaliador' role —
-- update or delete ANY evaluation in the org, not just their own. Ideally
-- UPDATE/DELETE would be scoped to "the member who authored this
-- evaluation", but `members` (the evaluee/evaluator domain rows) has no
-- link to `auth.users` yet — that's a real schema gap, not something this
-- policy alone can fix. Until `members.user_id` exists, the safest
-- available tightening is: any org member can create an evaluation
-- (matches today's UI, which only ever creates), but only an org admin can
-- modify or delete one after the fact.
create policy "org members read evaluations" on evaluations
  for select using (is_org_member(organization_id));
create policy "org members create evaluations" on evaluations
  for insert with check (is_org_member(organization_id));
create policy "org admins update evaluations" on evaluations
  for update using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "org admins delete evaluations" on evaluations
  for delete using (is_org_admin(organization_id));

create policy "org members read evaluation_responses" on evaluation_responses
  for select using (is_org_member((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org members create evaluation_responses" on evaluation_responses
  for insert with check (is_org_member((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org admins update evaluation_responses" on evaluation_responses
  for update using (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)))
  with check (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org admins delete evaluation_responses" on evaluation_responses
  for delete using (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)));

create policy "org members read evaluation_section_notes" on evaluation_section_notes
  for select using (is_org_member((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org members create evaluation_section_notes" on evaluation_section_notes
  for insert with check (is_org_member((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org admins update evaluation_section_notes" on evaluation_section_notes
  for update using (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)))
  with check (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)));
create policy "org admins delete evaluation_section_notes" on evaluation_section_notes
  for delete using (is_org_admin((select organization_id from evaluations where evaluations.id = evaluation_id)));

-- ---------------------------------------------------------------------------
-- Audit log (append-only, admins can read)
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "org admins read audit_log" on audit_log
  for select using (is_org_admin(organization_id));
create policy "org members write audit_log" on audit_log
  for insert with check (is_org_member(organization_id) and actor_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index idx_roles_org on roles(organization_id);
create index idx_members_org on members(organization_id);
create index idx_members_role on members(role_id);
create index idx_evaluations_org on evaluations(organization_id);
create index idx_evaluations_evaluatee on evaluations(evaluatee_member_id);
create index idx_evaluations_evaluator on evaluations(evaluator_member_id);
create index idx_evaluations_created_at on evaluations(created_at);
create index idx_evaluation_responses_evaluation on evaluation_responses(evaluation_id);
create index idx_role_competencies_competency on role_competencies(competency_id);
create index idx_competencies_category on competencies(category_id);
create index idx_competency_questions_competency on competency_questions(competency_id);
