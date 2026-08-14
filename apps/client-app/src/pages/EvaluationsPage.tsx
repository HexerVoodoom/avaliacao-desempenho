import * as React from 'react';
import type { Evaluation, EvaluationType, Member, Organization, Role } from '@studio/domain';
import { average } from '@studio/domain';
import { Badge, Button, PageHeader, Card, EmptyState, Select, Input, ListRowGroup, ListRow } from '@studio/ui';
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
      <PageHeader
        title="Avaliações"
        actions={
          <Button variant="primary" onClick={() => setCreating(true)} disabled={organization.enabledEvaluationTypes.length === 0}>
            Nova avaliação
          </Button>
        }
      />

      <div className="mb-[var(--space-4)] flex flex-wrap gap-[var(--space-2)]">
        <Select
          className="w-auto"
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
        </Select>
        <Select
          className="w-auto"
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
        </Select>
        <Input
          type="date"
          className="w-auto"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          aria-label="Data inicial do filtro"
        />
        <Input
          type="date"
          className="w-auto"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          aria-label="Data final do filtro"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação encontrada"
          description={
            evaluations.length === 0
              ? 'Aplique a primeira avaliação de desempenho.'
              : 'Ajuste os filtros para ver mais resultados.'
          }
        />
      ) : (
        <Card padded={false}>
          <ListRowGroup>
            {filtered.map((ev) => {
              const evaluatee = memberById.get(ev.evaluateeMemberId);
              const evaluator = memberById.get(ev.evaluatorMemberId);
              const role = roleById.get(ev.roleId);
              const overallAverage = average(ev.responses.map((r) => r.score));
              return (
                <ListRow
                  key={ev.id}
                  title={evaluatee ? `${evaluatee.firstName} ${evaluatee.lastName ?? ''}` : 'Membro removido'}
                  meta={
                    <>
                      {role?.name ?? '—'} · avaliado por {evaluator ? evaluator.firstName : '—'} ·{' '}
                      {new Date(ev.createdAt).toLocaleDateString('pt-BR')}
                    </>
                  }
                  actions={
                    <>
                      <Badge tone="neutral">{EVALUATION_TYPE_LABEL[ev.type]}</Badge>
                      <Badge tone="primary">{overallAverage.toFixed(1)}/5</Badge>
                    </>
                  }
                />
              );
            })}
          </ListRowGroup>
        </Card>
      )}
    </div>
  );
}
