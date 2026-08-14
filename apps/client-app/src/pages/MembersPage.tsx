import * as React from 'react';
import type { Member, Organization, PartialDate, Role } from '@studio/domain';
import { Button, Badge, PartialDateInput, ConfirmDialog } from '@studio/ui';
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
      {deleteError && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 12 }}>
          Não foi possível remover: {deleteError}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Membros</h1>
        {!editing && (
          <Button variant="primary" onClick={() => setEditing('new')} disabled={roles.length === 0}>
            Novo membro
          </Button>
        )}
      </div>

      {roles.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          Crie ao menos um cargo antes de cadastrar membros — cada membro precisa de um cargo.
        </p>
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

      {!editing && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => {
            const role = roleById.get(m.roleId);
            return (
              <li
                key={m.id}
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
                  <strong>
                    {m.firstName} {m.lastName}
                  </strong>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    {role?.name ?? 'Cargo removido'} · nasc. {formatPartialDate(m.birthDate)} · início{' '}
                    {formatPartialDate(m.startDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {role && <Badge tone="primary">{role.type}</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => setEditing(m)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => requestDelete(m)}>
                    Remover
                  </Button>
                </div>
              </li>
            );
          })}
          {members.length === 0 && <li style={{ color: 'var(--color-text-muted)' }}>Nenhum membro cadastrado ainda.</li>}
        </ul>
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
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-base)',
        marginBottom: 16,
        maxWidth: 480,
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={fieldLabelStyle}>
          Nome
          <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label style={fieldLabelStyle}>
          Sobrenome
          <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>

      <PartialDateInput label="Data de nascimento" value={birthDate} onChange={setBirthDate} />
      <PartialDateInput label="Início na empresa" value={startDate} onChange={setStartDate} />

      <label style={fieldLabelStyle}>
        Cargo e atuação
        <select style={inputStyle} value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
          <option value="" disabled>
            Selecione um cargo
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.type})
            </option>
          ))}
        </select>
      </label>

      {selectedRole && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Prévia:</span>
          <Badge tone="primary">{selectedRole.type}</Badge>
          <Badge tone="neutral">{selectedRole.activities.length} atividades</Badge>
          <Badge tone="neutral">{selectedRole.competencyLinks.length} competências</Badge>
        </div>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
          Não foi possível salvar: {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary">
          {initialMember ? 'Salvar alterações' : 'Salvar membro'}
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
