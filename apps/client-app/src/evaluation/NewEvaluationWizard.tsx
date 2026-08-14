import * as React from 'react';
import type { Category, Competency, EvaluationType, Member, Organization, Role } from '@studio/domain';
import { Button, Badge } from '@studio/ui';
import { store } from '../store';
import { buildSections } from './buildSections';
import { EvaluationRunner } from './EvaluationRunner';
import { ResultScreen } from './ResultScreen';
import { EVALUATION_TYPE_LABEL, type RunnerResult, type RunnerSection } from './types';

interface NewEvaluationWizardProps {
  organization: Organization;
  onDone: () => void;
}

type Step = 'setup' | 'run' | 'result';

export function NewEvaluationWizard({ organization, onDone }: NewEvaluationWizardProps) {
  const [step, setStep] = React.useState<Step>('setup');
  const [members, setMembers] = React.useState<Member[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [competencies, setCompetencies] = React.useState<Competency[]>([]);

  const [evaluatorId, setEvaluatorId] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [evaluateeId, setEvaluateeId] = React.useState('');
  const [evaluationType, setEvaluationType] = React.useState<EvaluationType | ''>('');

  const [sections, setSections] = React.useState<RunnerSection[]>([]);
  const [runnerResult, setRunnerResult] = React.useState<RunnerResult | null>(null);
  const [createdAt, setCreatedAt] = React.useState('');

  React.useEffect(() => {
    Promise.all([
      store.members.list(organization.id),
      store.roles.list(organization.id),
      store.competencyLibrary.listCategories(),
      store.competencyLibrary.listCompetencies(),
    ]).then(([m, r, cats, comps]) => {
      setMembers(m);
      setRoles(r);
      setCategories(cats);
      setCompetencies(comps);
    });
  }, [organization.id]);

  const roleById = React.useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);
  const evaluatee = members.find((m) => m.id === evaluateeId);
  const evaluator = members.find((m) => m.id === evaluatorId);
  const evaluateeRole = evaluatee ? roleById.get(evaluatee.roleId) : undefined;

  const filteredEvaluatees = members.filter((m) => (roleFilter === 'all' ? true : m.roleId === roleFilter));

  const canStart = !!evaluator && !!evaluatee && !!evaluationType;

  function handleStart() {
    if (!evaluateeRole || !evaluationType) return;
    const built = buildSections(evaluationType, evaluateeRole, categories, competencies);
    setSections(built);
    setCreatedAt(new Date().toISOString());
    setStep('run');
  }

  async function handleFinishRun(result: RunnerResult) {
    setRunnerResult(result);
    setStep('result');

    if (!evaluator || !evaluatee || !evaluateeRole || !evaluationType) return;

    // Two-step, same reasoning as RoleForm.handleSubmit: responses/notes carry
    // the parent evaluationId, which only exists once the evaluation itself
    // has an id.
    const evaluation = await store.evaluations.create({
      organizationId: organization.id,
      type: evaluationType,
      status: 'completed',
      evaluatorMemberId: evaluator.id,
      evaluateeMemberId: evaluatee.id,
      roleId: evaluateeRole.id,
      completedAt: new Date().toISOString(),
      responses: [],
      sectionNotes: [],
    });

    await store.evaluations.update(evaluation.id, {
      responses: Object.entries(result.responses).map(([targetId, r]) => ({
        id: `${evaluation.id}-${targetId}`,
        evaluationId: evaluation.id,
        targetId,
        score: r.score,
        keywords: r.keywords,
      })),
      sectionNotes: Object.entries(result.sectionNotes).map(([categoryId, n]) => ({
        id: `${evaluation.id}-${categoryId}`,
        evaluationId: evaluation.id,
        categoryId,
        observation: n.observation || undefined,
        improvementAction: n.improvementAction || undefined,
      })),
    });
  }

  if (step === 'result' && runnerResult && evaluator && evaluatee && evaluateeRole && evaluationType) {
    return (
      <ResultScreen
        evaluationType={evaluationType}
        evaluator={evaluator}
        evaluatee={evaluatee}
        role={evaluateeRole}
        sections={sections}
        result={runnerResult}
        createdAt={createdAt}
        onDone={onDone}
      />
    );
  }

  if (step === 'run' && evaluationType) {
    return (
      <EvaluationRunner
        evaluationType={evaluationType}
        sections={sections}
        onFinish={handleFinishRun}
        onCancel={() => setStep('setup')}
      />
    );
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Nova avaliação</h1>

      <label style={fieldLabelStyle}>
        Avaliador (quem está aplicando)
        <select style={inputStyle} value={evaluatorId} onChange={(e) => setEvaluatorId(e.target.value)}>
          <option value="">Selecione...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName} — {roleById.get(m.roleId)?.name ?? 'sem cargo'}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabelStyle}>
        Filtrar avaliado(a) por cargo (opcional)
        <select style={inputStyle} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">Todos os cargos</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <label style={fieldLabelStyle}>
        Avaliado(a)
        <select style={inputStyle} value={evaluateeId} onChange={(e) => setEvaluateeId(e.target.value)}>
          <option value="">Selecione...</option>
          {filteredEvaluatees.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName} — {roleById.get(m.roleId)?.name ?? 'sem cargo'}
            </option>
          ))}
        </select>
      </label>

      {evaluateeRole && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge tone="primary">{evaluateeRole.type}</Badge>
          <Badge tone="neutral">{evaluateeRole.name}</Badge>
        </div>
      )}

      <label style={fieldLabelStyle}>
        Método de avaliação
        <select style={inputStyle} value={evaluationType} onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}>
          <option value="">Selecione...</option>
          {organization.enabledEvaluationTypes.map((t) => (
            <option key={t} value={t}>
              {EVALUATION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={handleStart} disabled={!canStart}>
          Iniciar avaliação
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
};
