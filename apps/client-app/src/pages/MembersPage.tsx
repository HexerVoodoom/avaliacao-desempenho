import * as React from 'react';
import type { Member, Organization, PartialDate, Role } from '@studio/domain';
import {
  Button,
  Badge,
  PartialDateInput,
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

function formatPartialDate(d?: PartialDate): string {
  if (!d) return '—';
  const [y = '', m = '', day = ''] = d.value.split('-');
  if (d.precision === 'year') return y;
  if (d.precision === 'month') return `${m}/${y}`;
  return `${day}/${m}/${y}`;
}

interface MembersPageProps {
  organization: Organization;
}

export function MembersPage({ organization }: MembersPageProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [editing, setEditing] = React.useState<Member | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Member | null>(null);
  const [deleteTargetEvalCount, setDeleteTargetEvalCount] = React.useState(0);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const roleById = React.useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);

  const refresh = React.useCallback(async () => {
    const [m, r] = await Promise.all([
      store.members.list(organization.id),
      store.roles.list(organization.id),
    ]);
    setMembers(m);
    setRoles(r);
  }, [organization.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // A member can be the evaluator or the evaluatee on past Evaluations —
  // deleting them doesn't corrupt those records (they still exist in
  // storage), but the member vanishes from every picker, including
  // HistoryPage's, which makes that history practically unreachable. Warn
  // before doing it instead of silently orphaning it (ProdSquad finding,
  // qa-sweeper + staff-backend).
  async function requestDelete(member: Member) {
    const evaluations = await store.evaluations.list(organization.id);
    const count = evaluations.filter(
      (e) => e.evaluateeMemberId === member.id || e.evaluatorMemberId === member.id
    ).length;
    setDeleteTargetEvalCount(count);
    setDeleteTarget(member);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await store.members.remove(deleteTarget.id);
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
        title="Membros"
        actions={
          !editing && (
            <Button variant="primary" onClick={() => setEditing('new')} disabled={roles.length === 0}>
              Novo membro
            </Button>
          )
        }
      />

      {deleteError && (
        <p role="alert" className="mb-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--color-danger)]">
          Não foi possível remover: {deleteError}
        </p>
      )}

      {roles.length === 0 && !editing && (
        <EmptyState
          title="Nenhum cargo cadastrado ainda"
          description="Crie ao menos um cargo antes de cadastrar membros — cada membro precisa de um cargo."
        />
      )}

      {editing && (
        <MemberForm
          organization={organization}
          roles={roles}
          initialMember={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {!editing && roles.length > 0 && (
        <>
          {members.length === 0 ? (
            <EmptyState title="Nenhum membro cadastrado ainda" description="Cadastre o primeiro membro do time." />
          ) : (
            <Card padded={false}>
              <ListRowGroup>
                {members.map((m) => {
                  const role = roleById.get(m.roleId);
                  return (
                    <ListRow
                      key={m.id}
                      title={`${m.firstName} ${m.lastName ?? ''}`.trim()}
                      meta={
                        <>
                          {role?.name ?? 'Cargo removido'} · nasc. {formatPartialDate(m.birthDate)} · início{' '}
                          {formatPartialDate(m.startDate)}
                        </>
                      }
                      actions={
                        <>
                          {role && <Badge tone="primary">{role.type}</Badge>}
                          <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => requestDelete(m)}>
                            Remover
                          </Button>
                        </>
                      }
                    />
                  );
                })}
              </ListRowGroup>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remover "${deleteTarget?.firstName} ${deleteTarget?.lastName ?? ''}"?`}
        description={
          deleteTargetEvalCount > 0
            ? `Essa ação não pode ser desfeita. ${deleteTargetEvalCount} avaliação(ões) ligadas a este membro continuam salvas, mas ficam inacessíveis em Histórico (que busca por membro).`
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Remover"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface MemberFormProps {
  organization: Organization;
  roles: Role[];
  initialMember?: Member;
  onCancel: () => void;
  onSaved: () => void;
}

function MemberForm({ organization, roles, initialMember, onCancel, onSaved }: MemberFormProps) {
  const [firstName, setFirstName] = React.useState(initialMember?.firstName ?? '');
  const [lastName, setLastName] = React.useState(initialMember?.lastName ?? '');
  const [birthDate, setBirthDate] = React.useState<PartialDate | undefined>(initialMember?.birthDate);
  const [startDate, setStartDate] = React.useState<PartialDate | undefined>(initialMember?.startDate);
  const [roleId, setRoleId] = React.useState(initialMember?.roleId ?? '');
  const [error, setError] = React.useState<string | null>(null);

  const roleById = React.useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const selectedRole = roleId ? roleById.get(roleId) : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !roleId) return;
    setError(null);

    try {
      if (initialMember) {
        await store.members.update(initialMember.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          birthDate,
          startDate,
          roleId,
        });
      } else {
        await store.members.create({
          organizationId: organization.id,
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          birthDate,
          startDate,
          roleId,
        });
      }
      onSaved();
    } catch (err) {
      // Previously an uncaught rejection — a full localStorage quota, for
      // instance, would fail this write silently and the form would just
      // sit there with no explanation (ProdSquad finding, staff-backend +
      // qa-sweeper).
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="mb-[var(--space-6)] flex max-w-[480px] flex-col gap-[var(--space-4)]">
      <div className="flex gap-[var(--space-3)]">
        <Field label="Nome">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </Field>
        <Field label="Sobrenome">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>

      <PartialDateInput label="Data de nascimento" value={birthDate} onChange={setBirthDate} />
      <PartialDateInput label="Início na empresa" value={startDate} onChange={setStartDate} />

      <Field label="Cargo e atuação">
        <Select value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
          <option value="" disabled>
            Selecione um cargo
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.type})
            </option>
          ))}
        </Select>
      </Field>

      {selectedRole && (
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">Prévia:</span>
          <Badge tone="primary">{selectedRole.type}</Badge>
          <Badge tone="neutral">{selectedRole.activities.length} atividades</Badge>
          <Badge tone="neutral">{selectedRole.competencyLinks.length} competências</Badge>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[length:var(--font-size-sm)] text-[var(--color-danger)]">
          Não foi possível salvar: {error}
        </p>
      )}

      <div className="flex gap-[var(--space-2)]">
        <Button type="submit" variant="primary">
          {initialMember ? 'Salvar alterações' : 'Salvar membro'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
