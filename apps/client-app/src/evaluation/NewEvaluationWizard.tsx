import * as React from 'react';
import type { Category, Competency, EvaluationType, Member, Organization, Role } from '@studio/domain';
import { Button, Badge, PageHeader, Card, Field, Select } from '@studio/ui';
import { store } from '../store';
import { buildSections } from './buildSections';
import { EvaluationRunner } from './EvaluationRunner';
import { ResultScreen } from './ResultScreen';
import { EVALUATION_TYPE_LABEL, type RunnerResult, type RunnerSection } from './types';

interface NewEvaluationWizardProps {
  organization: Organization;
  onDone: () => void;
}

type Step = 'setup' | 'run' | 'saving' | 'save-failed' | 'result';

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
  const [saveError, setSaveError] = React.useState<string | null>(null);

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
    // The result screen must only ever show a SAVED evaluation — 4 of the 11
    // ProdSquad personas independently flagged the previous version (which
    // called setStep('result') before persistence resolved) as a silent
    // data-loss bug: if the write failed, the evaluator saw a normal result
    // screen for a session that was never recorded. Persist first; only
    // advance to 'result' once both writes actually succeed.
    setRunnerResult(result);
    setStep('saving');
    setSaveError(null);
    await persist(result);
  }

  async function persist(result: RunnerResult) {
    if (!evaluator || !evaluatee || !evaluateeRole || !evaluationType) return;
    try {
      // Two-step, same reasoning as RoleForm.handleSubmit: responses/notes
      // carry the parent evaluationId, which only exists once the
      // evaluation itself has an id.
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

      setStep('result');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
      setStep('save-failed');
    }
  }

  if (step === 'saving') {
    return <p className="text-[length:var(--font-size-md)] text-[var(--color-text-muted)]">Salvando avaliação…</p>;
  }

  if (step === 'save-failed') {
    return (
      <div className="flex max-w-[480px] flex-col gap-[var(--space-3)]">
        <h1 className="text-[length:var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-danger)]">
          Não foi possível salvar a avaliação
        </h1>
        <p className="text-[length:var(--font-size-md)] text-[var(--color-text-muted)]">
          Suas respostas continuam nesta tela — nada foi perdido. Erro: {saveError}
        </p>
        <div className="flex gap-[var(--space-2)]">
          <Button variant="primary" onClick={() => runnerResult && persist(runnerResult)}>
            Tentar salvar de novo
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Sair sem salvar
          </Button>
        </div>
      </div>
    );
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
    <div className="max-w-[480px]">
      <PageHeader title="Nova avaliação" />

      <Card className="flex flex-col gap-[var(--space-4)]">
        <Field label="Avaliador (quem está aplicando)">
          <Select value={evaluatorId} onChange={(e) => setEvaluatorId(e.target.value)}>
            <option value="">Selecione...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} — {roleById.get(m.roleId)?.name ?? 'sem cargo'}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Filtrar avaliado(a) por cargo (opcional)">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Todos os cargos</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Avaliado(a)">
          <Select value={evaluateeId} onChange={(e) => setEvaluateeId(e.target.value)}>
            <option value="">Selecione...</option>
            {filteredEvaluatees.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName} — {roleById.get(m.roleId)?.name ?? 'sem cargo'}
              </option>
            ))}
          </Select>
        </Field>

        {evaluateeRole && (
          <div className="flex gap-[var(--space-2)]">
            <Badge tone="primary">{evaluateeRole.type}</Badge>
            <Badge tone="neutral">{evaluateeRole.name}</Badge>
          </div>
        )}

        <Field label="Método de avaliação">
          <Select value={evaluationType} onChange={(e) => setEvaluationType(e.target.value as EvaluationType)}>
            <option value="">Selecione...</option>
            {organization.enabledEvaluationTypes.map((t) => (
              <option key={t} value={t}>
                {EVALUATION_TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex gap-[var(--space-2)]">
          <Button variant="primary" onClick={handleStart} disabled={!canStart}>
            Iniciar avaliação
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}
