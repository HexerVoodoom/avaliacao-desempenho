import * as React from 'react';
import type { Member, Organization, PartialDate, Role } from '@studio/domain';
import { Button, Badge, PartialDateInput } from '@studio/ui';
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
  const [creating, setCreating] = React.useState(false);

  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [birthDate, setBirthDate] = React.useState<PartialDate>();
  const [startDate, setStartDate] = React.useState<PartialDate>();
  const [roleId, setRoleId] = React.useState('');

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

  function resetForm() {
    setFirstName('');
    setLastName('');
    setBirthDate(undefined);
    setStartDate(undefined);
    setRoleId('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !roleId) return;
    await store.members.create({
      organizationId: organization.id,
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      birthDate,
      startDate,
      roleId,
    });
    resetForm();
    setCreating(false);
    refresh();
  }

  async function handleDelete(id: string) {
    await store.members.remove(id);
    refresh();
  }

  const selectedRole = roleId ? roleById.get(roleId) : undefined;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Membros</h1>
        {!creating && (
          <Button variant="primary" onClick={() => setCreating(true)} disabled={roles.length === 0}>
            Novo membro
          </Button>
        )}
      </div>

      {roles.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          Crie ao menos um cargo antes de cadastrar membros — cada membro precisa de um cargo.
        </p>
      )}

      {creating && (
        <form
          onSubmit={handleCreate}
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

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" variant="primary">
              Salvar membro
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {role && <Badge tone="primary">{role.type}</Badge>}
                <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                  Remover
                </Button>
              </div>
            </li>
          );
        })}
        {members.length === 0 && <li style={{ color: 'var(--color-text-muted)' }}>Nenhum membro cadastrado ainda.</li>}
      </ul>
    </div>
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
