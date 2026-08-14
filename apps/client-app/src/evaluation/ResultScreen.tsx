import * as React from 'react';
import type { EvaluationType, Member, Role, ScoreValue } from '@studio/domain';
import { OVERALL_SCALE_LEGEND, average } from '@studio/domain';
import { Badge, Button, PageHeader, Card } from '@studio/ui';
import { EVALUATION_TYPE_LABEL, type RunnerResult, type RunnerSection } from './types';

interface ResultScreenProps {
  evaluationType: EvaluationType;
  evaluator: Member;
  evaluatee: Member;
  role: Role;
  sections: RunnerSection[];
  result: RunnerResult;
  createdAt: string;
  onDone: () => void;
}

export function ResultScreen({
  evaluationType,
  evaluator,
  evaluatee,
  role,
  sections,
  result,
  createdAt,
  onDone,
}: ResultScreenProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const allScores = sections.flatMap((s) => s.items.map((i) => result.responses[i.id]?.score)).filter((s): s is ScoreValue => !!s);
  const overallAverage = average(allScores);
  const overallRounded = Math.max(1, Math.min(5, Math.round(overallAverage))) as ScoreValue;
  const totalQuestions = sections.reduce((sum, s) => sum + s.items.length, 0);

  function toggle(categoryId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  return (
    <div className="max-w-[640px]">
      <PageHeader title="Resumo da avaliação" />

      <div className="mb-[var(--space-6)] flex flex-wrap gap-[var(--space-4)] text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
        <span>
          <strong className="text-[var(--color-text-primary)]">Avaliado(a):</strong> {evaluatee.firstName} {evaluatee.lastName}
        </span>
        <span>
          <strong className="text-[var(--color-text-primary)]">Cargo:</strong> {role.name}
        </span>
        <span>
          <strong className="text-[var(--color-text-primary)]">Data:</strong> {new Date(createdAt).toLocaleDateString('pt-BR')}
        </span>
        <span>
          <strong className="text-[var(--color-text-primary)]">Perguntas:</strong> {totalQuestions}
        </span>
        <span>
          <strong className="text-[var(--color-text-primary)]">Aplicada por:</strong> {evaluator.firstName} {evaluator.lastName}
        </span>
        <span>
          <strong className="text-[var(--color-text-primary)]">Método:</strong> {EVALUATION_TYPE_LABEL[evaluationType]}
        </span>
      </div>

      <div className="mb-[var(--space-6)] rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-[var(--space-6)]">
        <div className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">Nota geral</div>
        <div className="text-[length:var(--font-size-2xl)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
          {overallAverage.toFixed(1)} / 5
        </div>
        <div className="mt-[var(--space-1)] text-[length:var(--font-size-sm)]">{OVERALL_SCALE_LEGEND[overallRounded]}</div>
      </div>

      <h2 className="mb-[var(--space-2)] text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
        Desempenho por categoria
      </h2>
      <div className="mb-[var(--space-6)] flex flex-col gap-[var(--space-2)]">
        {sections.map((section) => {
          const scores = section.items.map((i) => result.responses[i.id]?.score).filter((s): s is ScoreValue => !!s);
          const sectionAverage = average(scores);
          const isOpen = expanded.has(section.categoryId);
          return (
            <Card key={section.categoryId} padded={false}>
              <button
                type="button"
                onClick={() => toggle(section.categoryId)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] text-left cursor-pointer bg-transparent border-none focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                <span>{section.categoryName}</span>
                <div className="flex items-center gap-[var(--space-2)]">
                  <Badge tone="neutral">{section.items.length} perguntas</Badge>
                  <Badge tone="primary">{sectionAverage.toFixed(1)}</Badge>
                  <span aria-hidden>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-4)] pb-[var(--space-4)]">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-[var(--space-3)] text-[length:var(--font-size-sm)]">
                      <span>{item.text}</span>
                      <Badge tone="neutral">{result.responses[item.id]?.score ?? '—'}</Badge>
                    </div>
                  ))}
                  {result.sectionNotes[section.categoryId]?.observation && (
                    <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
                      <strong>Observação:</strong> {result.sectionNotes[section.categoryId]?.observation}
                    </p>
                  )}
                  {result.sectionNotes[section.categoryId]?.improvementAction && (
                    <p className="m-0 text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
                      <strong>Ação combinada:</strong> {result.sectionNotes[section.categoryId]?.improvementAction}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button variant="primary" onClick={onDone}>
        Concluir
      </Button>
    </div>
  );
}
