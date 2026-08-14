import * as React from 'react';
import type { EvaluationType, ScoreValue } from '@studio/domain';
import { SCALE_LABELS, improvementPromptFor, average } from '@studio/domain';
import { Button, Badge, ConfirmDialog, Card, Field, Input, Textarea, cn } from '@studio/ui';
import type { RunnerResult, RunnerSection, SectionNoteDraft } from './types';

interface EvaluationRunnerProps {
  evaluationType: EvaluationType;
  sections: RunnerSection[];
  onFinish: (result: RunnerResult) => void;
  onCancel: () => void;
}

const SCORES: ScoreValue[] = [1, 2, 3, 4, 5];

// Matches the semantic scale documented in brand/design-system.md (§2):
// success = notas altas, warning = notas médias, danger = notas baixas.
// Flagged by 2 of the 11 ProdSquad reviews (design-critic, product-designer)
// as a real gap — the score buttons previously all looked the same
// regardless of value, on the screen used live, in front of the person
// being evaluated.
const SCORE_COLOR: Record<ScoreValue, string> = {
  1: 'var(--color-danger)',
  2: 'var(--color-danger)',
  3: 'var(--color-warning)',
  4: 'var(--color-success)',
  5: 'var(--color-success)',
};

export function EvaluationRunner({ evaluationType, sections, onFinish, onCancel }: EvaluationRunnerProps) {
  const [sectionIndex, setSectionIndex] = React.useState(0);
  const [result, setResult] = React.useState<RunnerResult>({ responses: {}, sectionNotes: {} });
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  const section = sections[sectionIndex];
  const scaleLabels = SCALE_LABELS[evaluationType];
  const isLastSection = sectionIndex === sections.length - 1;

  if (!section) {
    return (
      <div>
        <p className="mb-[var(--space-3)] text-[length:var(--font-size-md)] text-[var(--color-text-muted)]">
          Este cargo não tem itens configurados para o método {evaluationType}. Volte e escolha outro método, ou
          adicione indicadores ao cargo em Cargos.
        </p>
        <Button variant="ghost" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    );
  }

  const answeredCount = section.items.filter((item) => result.responses[item.id]).length;
  const allAnswered = answeredCount === section.items.length;
  const hasProgress = Object.keys(result.responses).length > 0;

  function setScore(itemId: string, score: ScoreValue) {
    setResult((prev) => ({
      ...prev,
      responses: { ...prev.responses, [itemId]: { ...prev.responses[itemId], score } },
    }));
  }

  function setKeyword(itemId: string, index: 0 | 1 | 2, value: string) {
    setResult((prev) => {
      const current = prev.responses[itemId]?.keywords ?? ['', '', ''];
      const next = [...current] as [string, string, string];
      next[index] = value;
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [itemId]: { score: prev.responses[itemId]?.score ?? 3, keywords: next },
        },
      };
    });
  }

  function setNote(categoryId: string, patch: Partial<SectionNoteDraft>) {
    setResult((prev) => ({
      ...prev,
      sectionNotes: {
        ...prev.sectionNotes,
        [categoryId]: {
          observation: prev.sectionNotes[categoryId]?.observation ?? '',
          improvementAction: prev.sectionNotes[categoryId]?.improvementAction ?? '',
          ...patch,
        },
      },
    }));
  }

  const sectionAverage = average(section.items.map((i) => result.responses[i.id]?.score).filter((s): s is ScoreValue => !!s));
  const promptKind = sectionAverage > 0 ? improvementPromptFor(sectionAverage) : 'melhorar';

  function goNext() {
    if (isLastSection) {
      onFinish(result);
    } else {
      setSectionIndex((i) => i + 1);
    }
  }

  function requestCancel() {
    // Discarding an in-progress evaluation is at least as destructive as
    // deleting a role/member (both already go through ConfirmDialog) — this
    // was the single most-agreed-on design finding across the ProdSquad
    // review (design-critic + product-designer), and it's the screen used
    // live, in front of the person being evaluated.
    if (hasProgress) {
      setConfirmingCancel(true);
    } else {
      onCancel();
    }
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-[var(--space-1)] text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
        Seção {sectionIndex + 1} de {sections.length}
      </div>
      <h2 className="text-[length:var(--font-size-xl)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
        {section.categoryName}
      </h2>
      {section.categoryDescription && (
        <p className="mb-[var(--space-4)] text-[length:var(--font-size-md)] leading-[var(--line-height-base)] text-[var(--color-text-muted)]">
          {section.categoryDescription}
        </p>
      )}

      <div className="flex flex-col gap-[var(--space-4)]">
        {section.items.map((item) => {
          const response = result.responses[item.id];
          return (
            <Card key={item.id}>
              <p className="mb-[var(--space-3)] text-[length:var(--font-size-md)] leading-[var(--line-height-base)]">{item.text}</p>

              {item.isDialogic && (
                <div className="mb-[var(--space-3)] flex gap-[var(--space-2)]">
                  {[0, 1, 2].map((i) => (
                    <Input
                      key={i}
                      placeholder={`Palavra-chave ${i + 1}`}
                      aria-label={`Palavra-chave ${i + 1} para: ${item.text}`}
                      value={response?.keywords?.[i] ?? ''}
                      onChange={(e) => setKeyword(item.id, i as 0 | 1 | 2, e.target.value)}
                    />
                  ))}
                </div>
              )}

              <div role="radiogroup" aria-label={`Nota para: ${item.text}`} className="flex flex-wrap gap-[var(--space-2)]">
                {SCORES.map((score) => {
                  const selected = response?.score === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setScore(item.id, score)}
                      className={cn(
                        'min-h-[44px] rounded-[var(--radius-sm)] border-2 px-[var(--space-3)] py-[var(--space-2)]',
                        'text-[length:var(--font-size-sm)] cursor-pointer transition-colors',
                        'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
                        selected ? 'text-[var(--color-text-on-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                      )}
                      style={selected ? { background: SCORE_COLOR[score], borderColor: SCORE_COLOR[score] } : undefined}
                    >
                      {score} — {scaleLabels[score]}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {section.categoryId !== 'atividades' && (
        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
          <Field label="Observação da seção">
            <Textarea
              value={result.sectionNotes[section.categoryId]?.observation ?? ''}
              onChange={(e) => setNote(section.categoryId, { observation: e.target.value })}
              placeholder="Qualquer coisa importante observada nesta seção..."
            />
          </Field>
          <Field
            label={promptKind === 'melhorar' ? 'O que posso fazer para melhorar?' : 'O que posso fazer para manter?'}
            labelAddon={sectionAverage > 0 ? <Badge tone="neutral">média da seção: {sectionAverage.toFixed(1)}</Badge> : undefined}
          >
            <Textarea
              value={result.sectionNotes[section.categoryId]?.improvementAction ?? ''}
              onChange={(e) => setNote(section.categoryId, { improvementAction: e.target.value })}
            />
          </Field>
        </div>
      )}

      <div className="mt-[var(--space-6)] flex justify-between">
        <Button variant="ghost" onClick={requestCancel}>
          Cancelar avaliação
        </Button>
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
            {answeredCount}/{section.items.length} respondidas
          </span>
          <Button variant="primary" onClick={goNext} disabled={!allAnswered}>
            {isLastSection ? 'Finalizar avaliação' : 'Próxima seção'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title="Cancelar esta avaliação?"
        description="Todas as respostas registradas até agora serão perdidas. Essa ação não pode ser desfeita."
        confirmLabel="Cancelar avaliação"
        cancelLabel="Voltar"
        tone="danger"
        onConfirm={onCancel}
      />
    </div>
  );
}
