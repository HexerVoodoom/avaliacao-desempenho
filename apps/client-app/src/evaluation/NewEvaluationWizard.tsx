import * as React from 'react';
import type { Category, Competency, EvaluationType, Member, Organization, Role } from '@studio/domain';
import { Button, Badge, ConfirmDialog } from '@studio/ui';
import { store } from '../store';
import { buildSections } from './buildSections';
import { EvaluationRunner } from './EvaluationRunner';
import { ResultScreen } from './ResultScreen';
import { EVALUATION_TYPE_LABEL, type RunnerResult, type RunnerSection } from './types';
import { PersonPicker } from './PersonPicker';

interface NewEvaluationWizardProps {
  organization: Organization;
  onDone: () => void;
}

type Step = 'setup' | 'run' | 'saving' | 'save-failed' | 'result';

export function NewEvaluationWizard({ organization, onDone }: NewEvaluationWizardProps) {
  const [step, setStep] = React.useState<Step>('setup');
  const [membersLoaded, setMembersLoaded] = React.useState(false);
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
  const [confirmingDiscard, setConfirmingDiscard] = React.useState(false);

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
      setMembersLoaded(true);
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
        // EvaluationRunner only calls onFinish once every item across every
        // section has a defined score (allSectionsAnswered) — so `r.score`
        // is guaranteed here even though ItemResponse.score is optional
        // while the evaluator is still filling the form in.
        responses: Object.entries(result.responses).map(([targetId, r]) => ({
          id: `${evaluation.id}-${targetId}`,
          evaluationId: evaluation.id,
          targetId,
          score: r.score!,
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
    return (
      <p role="status" aria-live="polite" style={{ color: 'var(--color-text-muted)' }}>
        Salvando avaliação… Suas respostas já foram registradas nesta tela.
      </p>
    );
  }

  if (step === 'save-failed') {
    return (
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-danger)' }}>
          Não foi possível salvar a avaliação
        </h1>
        <p role="status" aria-live="assertive" style={{ color: 'var(--color-text-muted)' }}>
          Suas respostas continuam nesta tela — nada foi perdido. Erro: {saveError}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="primary" onClick={() => runnerResult && persist(runnerResult)}>
            Tentar salvar de novo
          </Button>
          <Button variant="ghost" onClick={() => setConfirmingDiscard(true)}>
            Sair sem salvar
          </Button>
        </div>
        <ConfirmDialog
          open={confirmingDiscard}
          onOpenChange={setConfirmingDiscard}
          title="Sair sem salvar esta avaliação?"
          description="A avaliação está totalmente preenchida, mas ainda não foi gravada. Saindo agora, todas as respostas serão perdidas. Essa ação não pode ser desfeita."
          confirmLabel="Sair sem salvar"
          cancelLabel="Voltar"
          tone="danger"
          onConfirm={onDone}
        />
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

  if (membersLoaded && members.length === 0) {
    return (
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)' }}>Nova avaliação</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Nenhuma pessoa cadastrada ainda. Cadastre pelo menos um membro em Pessoas antes de aplicar uma avaliação.
        </p>
        <Button variant="ghost" onClick={onDone}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Nova avaliação</h1>

      <PersonPicker
        label="Avaliador (quem está aplicando)"
        members={members}
        roleById={roleById}
        selectedId={evaluatorId}
        onSelect={setEvaluatorId}
      />

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

      <PersonPicker
        label="Avaliado(a)"
        members={filteredEvaluatees}
        roleById={roleById}
        selectedId={evaluateeId}
        onSelect={setEvaluateeId}
      />

      {evaluateeRole && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge tone="primary">{evaluateeRole.type}</Badge>
          <Badge tone="neutral">{evaluateeRole.name}</Badge>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            (ⓘ cargo do cadastro da pessoa — define os critérios da avaliação, não é editável aqui)
          </span>
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
