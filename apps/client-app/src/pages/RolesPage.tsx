import * as React from 'react';
import type { Category, Competency, Organization, Role, RoleActivity, RoleCompetencyLink } from '@studio/domain';
import {
  Button,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  ConfirmDialog,
  PageHeader,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  ListRowGroup,
  ListRow,
} from '@studio/ui';
import { store } from '../store';

interface RolesPageProps {
  organization: Organization;
}

export function RolesPage({ organization }: RolesPageProps) {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [competencies, setCompetencies] = React.useState<Competency[]>([]);
  const [editing, setEditing] = React.useState<Role | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Role | null>(null);
  const [blockedDeleteRole, setBlockedDeleteRole] = React.useState<Role | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [filterType, setFilterType] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  const refresh = React.useCallback(async () => {
    const [r, cats, comps] = await Promise.all([
      store.roles.list(organization.id),
      store.competencyLibrary.listCategories(),
      store.competencyLibrary.listCompetencies(),
    ]);
    setRoles(r);
    setCategories(cats);
    setCompetencies(comps);
  }, [organization.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredRoles = roles.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function requestDelete(role: Role) {
    // Previously only checked Members — a role referenced solely by past
    // Evaluations (e.g. the member who held it was later moved to a
    // different role) could still be deleted, silently orphaning
    // Evaluation.roleId (ProdSquad finding, staff-backend + qa-sweeper).
    const [usedByMembers, usedByEvaluations] = await Promise.all([
      store.members.list(organization.id).then((members) => members.some((m) => m.roleId === role.id)),
      store.evaluations.list(organization.id).then((evals) => evals.some((e) => e.roleId === role.id)),
    ]);
    if (usedByMembers || usedByEvaluations) {
      setBlockedDeleteRole(role);
      return;
    }
    setDeleteTarget(role);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await store.roles.remove(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteError(null);
      refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Cargos"
        actions={
          !editing && (
            <Button variant="primary" onClick={() => setEditing('new')}>
              Novo cargo
            </Button>
          )
        }
      />

      {deleteError && (
        <p role="alert" className="mb-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--color-danger)]">
          Não foi possível remover: {deleteError}
        </p>
      )}

      {!editing && (
        <>
          <div className="mb-[var(--space-4)] flex gap-[var(--space-2)]">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-auto"
              aria-label="Filtrar cargos por tipo"
            >
              <option value="all">Todos os tipos</option>
              {organization.roleTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input
              className="flex-1"
              placeholder="Buscar por nome..."
              aria-label="Buscar cargos por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredRoles.length === 0 ? (
            <EmptyState
              title="Nenhum cargo encontrado"
              description={roles.length === 0 ? 'Crie o primeiro cargo da organização.' : 'Ajuste os filtros de busca.'}
            />
          ) : (
            <Card padded={false}>
              <ListRowGroup>
                {filteredRoles.map((r) => (
                  <ListRow
                    key={r.id}
                    title={r.name}
                    meta={
                      <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                        <Badge tone="primary">{r.type}</Badge>
                        <Badge tone="neutral">{r.activities.length} atividades</Badge>
                        <Badge tone="neutral">
                          {r.competencyLinks.reduce((sum, l) => sum + l.selectedQuestionIds.length, 0)} indicadores
                        </Badge>
                      </span>
                    }
                    actions={
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => requestDelete(r)}>
                          Remover
                        </Button>
                      </>
                    }
                  />
                ))}
              </ListRowGroup>
            </Card>
          )}
        </>
      )}

      {editing && (
        <RoleForm
          organization={organization}
          categories={categories}
          competencies={competencies}
          initialRole={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remover "${deleteTarget?.name}"?`}
        description="Essa ação não pode ser desfeita."
        confirmLabel="Remover"
        tone="danger"
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={!!blockedDeleteRole}
        onOpenChange={(open) => !open && setBlockedDeleteRole(null)}
        title="Não é possível remover este cargo"
        description={`"${blockedDeleteRole?.name}" tem membros e/ou avaliações vinculadas. Reatribua os membros a outro cargo antes de excluir.`}
        confirmLabel="Entendi"
        cancelLabel="Fechar"
        onConfirm={() => setBlockedDeleteRole(null)}
      />
    </div>
  );
}

interface RoleFormProps {
  organization: Organization;
  categories: Category[];
  competencies: Competency[];
  initialRole?: Role;
  onCancel: () => void;
  onSaved: () => void;
}

function RoleForm({ organization, categories, competencies, initialRole, onCancel, onSaved }: RoleFormProps) {
  const [name, setName] = React.useState(initialRole?.name ?? '');
  const [type, setType] = React.useState(initialRole?.type ?? organization.roleTypes[0] ?? 'associado');
  const [activities, setActivities] = React.useState<string[]>(initialRole?.activities.map((a) => a.text) ?? []);
  const [newActivity, setNewActivity] = React.useState('');
  const [links, setLinks] = React.useState<Map<string, Set<string>>>(
    () => new Map(initialRole?.competencyLinks.map((l) => [l.competencyId, new Set(l.selectedQuestionIds)]) ?? [])
  );

  const competenciesByCategory = React.useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      const list = map.get(c.categoryId) ?? [];
      list.push(c);
      map.set(c.categoryId, list);
    }
    return map;
  }, [competencies]);

  function addActivity() {
    if (!newActivity.trim()) return;
    setActivities((prev) => [...prev, newActivity.trim()]);
    setNewActivity('');
  }

  function removeActivity(index: number) {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleQuestion(competencyId: string, questionId: string) {
    setLinks((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(competencyId) ?? []);
      if (set.has(questionId)) set.delete(questionId);
      else set.add(questionId);
      next.set(competencyId, set);
      return next;
    });
  }

  function selectedCountFor(categoryId: string): number {
    let count = 0;
    for (const c of competenciesByCategory.get(categoryId) ?? []) {
      count += links.get(c.id)?.size ?? 0;
    }
    return count;
  }

  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    try {
      const roleId = initialRole
        ? initialRole.id
        : (
            // Created in two steps because RoleActivity/RoleCompetencyLink carry
            // the parent roleId, which only exists once the role itself has one.
            await store.roles.create({
              organizationId: organization.id,
              name: name.trim(),
              type,
              activities: [],
              competencyLinks: [],
            })
          ).id;

      const roleActivities: RoleActivity[] = activities.map((text, order) => ({
        id: `${roleId}-act-${order}`,
        roleId,
        text,
        order,
      }));

      const competencyLinks: RoleCompetencyLink[] = Array.from(links.entries())
        .filter(([, ids]) => ids.size > 0)
        .map(([competencyId, ids]) => ({
          roleId,
          competencyId,
          selectedQuestionIds: Array.from(ids),
        }));

      await store.roles.update(roleId, { name: name.trim(), type, activities: roleActivities, competencyLinks });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[640px] flex-col gap-[var(--space-6)]">
      <div className="flex gap-[var(--space-3)]">
        <Field label="Nome do cargo">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Tipo de atuação">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {organization.roleTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <section>
        <h3 className="mb-[var(--space-2)] text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)]">
          Atividades específicas
        </h3>
        <div className="mb-[var(--space-2)] flex gap-[var(--space-2)]">
          <Input
            className="flex-1"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            placeholder="Descreva uma atividade..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addActivity();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addActivity}>
            Adicionar
          </Button>
        </div>
        {activities.length > 0 && (
          <ol className="flex flex-col gap-[var(--space-1)] pl-[var(--space-6)]">
            {activities.map((a, i) => (
              <li key={i} className="flex justify-between gap-[var(--space-2)]">
                <span className="text-[length:var(--font-size-sm)]">{a}</span>
                <button
                  type="button"
                  onClick={() => removeActivity(i)}
                  className="border-none bg-none cursor-pointer text-[length:var(--font-size-sm)] text-[var(--color-danger)]"
                >
                  remover
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-[var(--space-2)] text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)]">
          Biblioteca de competências
        </h3>
        <Accordion type="multiple" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-[var(--space-3)]">
          {categories.map((cat) => (
            <AccordionItem key={cat.id} value={cat.id}>
              <AccordionTrigger>
                {cat.name}
                <Badge tone="primary" className="ml-[var(--space-2)]">
                  {selectedCountFor(cat.id)} selecionadas
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                {(competenciesByCategory.get(cat.id) ?? []).map((comp) => (
                  <div key={comp.id} className="mb-[var(--space-3)]">
                    <strong className="text-[length:var(--font-size-sm)]">{comp.name}</strong>
                    <div className="mt-[var(--space-1)] flex flex-col gap-[var(--space-1)] pl-[var(--space-2)]">
                      {comp.questions.map((q) => (
                        <label key={q.id} className="flex items-start gap-[var(--space-2)] text-[length:var(--font-size-sm)]">
                          <input
                            type="checkbox"
                            checked={links.get(comp.id)?.has(q.id) ?? false}
                            onChange={() => toggleQuestion(comp.id, q.id)}
                            className="mt-1"
                          />
                          <span>
                            {q.type === 'dialogic' ? <Badge tone="warning">base de diálogo</Badge> : <Badge tone="neutral">afirmação</Badge>}{' '}
                            {q.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {error && (
        <p role="alert" className="text-[length:var(--font-size-sm)] text-[var(--color-danger)]">
          Não foi possível salvar: {error}
        </p>
      )}

      <div className="flex gap-[var(--space-2)]">
        <Button type="submit" variant="primary">
          {initialRole ? 'Salvar alterações' : 'Salvar cargo'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
