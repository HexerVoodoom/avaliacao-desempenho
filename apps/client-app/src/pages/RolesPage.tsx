import * as React from 'react';
import type { Category, Competency, Organization, Role, RoleActivity, RoleCompetencyLink } from '@studio/domain';
import { Button, Badge, Accordion, AccordionItem, AccordionTrigger, AccordionContent, ConfirmDialog } from '@studio/ui';
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
      {deleteError && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 12 }}>
          Não foi possível remover: {deleteError}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Cargos</h1>
        {!editing && (
          <Button variant="primary" onClick={() => setEditing('new')}>
            Novo cargo
          </Button>
        )}
      </div>

      {!editing && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={inputStyle}
              aria-label="Filtrar cargos por tipo"
            >
              <option value="all">Todos os tipos</option>
              {organization.roleTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Buscar por nome..."
              aria-label="Buscar cargos por nome"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredRoles.map((r) => (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-base)',
                }}
              >
                <div>
                  <strong>{r.name}</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Badge tone="primary">{r.type}</Badge>
                    <Badge tone="neutral">{r.activities.length} atividades</Badge>
                    <Badge tone="neutral">
                      {r.competencyLinks.reduce((sum, l) => sum + l.selectedQuestionIds.length, 0)} indicadores
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => requestDelete(r)}>
                    Remover
                  </Button>
                </div>
              </li>
            ))}
            {filteredRoles.length === 0 && <li style={{ color: 'var(--color-text-muted)' }}>Nenhum cargo encontrado.</li>}
          </ul>
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={fieldLabelStyle}>
          Nome do cargo
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label style={fieldLabelStyle}>
          Tipo de atuação
          <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
            {organization.roleTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section>
        <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 8 }}>Atividades específicas</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
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
        <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {activities.map((a, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{a}</span>
              <button type="button" onClick={() => removeActivity(i)} style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}>
                remover
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 8 }}>Biblioteca de competências</h3>
        <Accordion type="multiple" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)', padding: '0 12px' }}>
          {categories.map((cat) => (
            <AccordionItem key={cat.id} value={cat.id}>
              <AccordionTrigger>
                {cat.name}
                <Badge tone="primary" style={{ marginLeft: 8 }}>
                  {selectedCountFor(cat.id)} selecionadas
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                {(competenciesByCategory.get(cat.id) ?? []).map((comp) => (
                  <div key={comp.id} style={{ marginBottom: 12 }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>{comp.name}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, paddingLeft: 8 }}>
                      {comp.questions.map((q) => (
                        <label key={q.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--font-size-sm)' }}>
                          <input
                            type="checkbox"
                            checked={links.get(comp.id)?.has(q.id) ?? false}
                            onChange={() => toggleQuestion(comp.id, q.id)}
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
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
          Não foi possível salvar: {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
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

const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
  flex: 1,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
};
