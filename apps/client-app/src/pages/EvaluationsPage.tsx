import * as React from 'react';
import type { Evaluation, EvaluationType, Member, Organization, Role } from '@studio/domain';
import { average } from '@studio/domain';
import { Badge, Button } from '@studio/ui';
import { store } from '../store';
import { NewEvaluationWizard } from '../evaluation/NewEvaluationWizard';
import { EVALUATION_TYPE_LABEL } from '../evaluation/types';

interface EvaluationsPageProps {
  organization: Organization;
}

export function EvaluationsPage({ organization }: EvaluationsPageProps) {
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [creating, setCreating] = React.useState(false);

  const [filterMember, setFilterMember] = React.useState('all');
  const [filterType, setFilterType] = React.useState<EvaluationType | 'all'>('all');
  const [filterFrom, setFilterFrom] = React.useState('');
  const [filterTo, setFilterTo] = React.useState('');

  const refresh = React.useCallback(async () => {
    const [evals, m, r] = await Promise.all([
      store.evaluations.list(organization.id),
      store.members.list(organization.id),
      store.roles.list(organization.id),
    ]);
    setEvaluations(evals.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setMembers(m);
    setRoles(r);
  }, [organization.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const memberById = React.useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const roleById = React.useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);

  const filtered = evaluations.filter((e) => {
    if (filterMember !== 'all' && e.evaluateeMemberId !== filterMember) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filterFrom && e.createdAt < filterFrom) return false;
    if (filterTo && e.createdAt > `${filterTo}T23:59:59.999Z`) return false;
    return true;
  });

  if (creating) {
    return (
      <NewEvaluationWizard
        organization={organization}
        onDone={() => {
          setCreating(false);
          refresh();
        }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Avaliações</h1>
        <Button variant="primary" onClick={() => setCreating(true)} disabled={organization.enabledEvaluationTypes.length === 0}>
          Nova avaliação
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          style={inputStyle}
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          aria-label="Filtrar avaliações por membro"
        >
          <option value="all">Todos os membros</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
        <select
          style={inputStyle}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as EvaluationType | 'all')}
          aria-label="Filtrar avaliações por método"
        >
          <option value="all">Todos os métodos</option>
          {(['dialogica', 'tradicional', 'atividades'] as EvaluationType[]).map((t) => (
            <option key={t} value={t}>
              {EVALUATION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          type="date"
          style={inputStyle}
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          aria-label="Data inicial do filtro"
        />
        <input
          type="date"
          style={inputStyle}
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          aria-label="Data final do filtro"
        />
      </div>

      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((ev) => {
          const evaluatee = memberById.get(ev.evaluateeMemberId);
          const evaluator = memberById.get(ev.evaluatorMemberId);
          const role = roleById.get(ev.roleId);
          const overallAverage = average(ev.responses.map((r) => r.score));
          return (
            <li
              key={ev.id}
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
                  {evaluatee ? `${evaluatee.firstName} ${evaluatee.lastName ?? ''}` : 'Membro removido'}
                </strong>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  {role?.name ?? '—'} · avaliado por {evaluator ? evaluator.firstName : '—'} ·{' '}
                  {new Date(ev.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge tone="neutral">{EVALUATION_TYPE_LABEL[ev.type]}</Badge>
                <Badge tone="primary">{overallAverage.toFixed(1)}/5</Badge>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <li style={{ color: 'var(--color-text-muted)' }}>Nenhuma avaliação encontrada.</li>}
      </ul>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
};
