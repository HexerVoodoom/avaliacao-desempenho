import * as React from 'react';
import type { EvaluationType, Member, Role, ScoreValue } from '@studio/domain';
import { OVERALL_SCALE_LEGEND, average } from '@studio/domain';
import { Badge, Button } from '@studio/ui';
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
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Resumo da avaliação</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, margin: '16px 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Avaliado(a):</strong> {evaluatee.firstName} {evaluatee.lastName}
        </span>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Cargo:</strong> {role.name}
        </span>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Data:</strong> {new Date(createdAt).toLocaleDateString('pt-BR')}
        </span>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Perguntas:</strong> {totalQuestions}
        </span>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Aplicada por:</strong> {evaluator.firstName} {evaluator.lastName}
        </span>
        <span>
          <strong style={{ color: 'var(--color-text-primary)' }}>Método:</strong> {EVALUATION_TYPE_LABEL[evaluationType]}
        </span>
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 'var(--radius-base)',
          background: 'var(--color-surface-muted)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>Nota geral</div>
        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{overallAverage.toFixed(1)} / 5</div>
        <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 4 }}>{OVERALL_SCALE_LEGEND[overallRounded]}</div>
      </div>

      <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>Desempenho por categoria</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {sections.map((section) => {
          const scores = section.items.map((i) => result.responses[i.id]?.score).filter((s): s is ScoreValue => !!s);
          const sectionAverage = average(scores);
          const isOpen = expanded.has(section.categoryId);
          return (
            <div key={section.categoryId} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)' }}>
              <button
                type="button"
                onClick={() => toggle(section.categoryId)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{section.categoryName}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge tone="neutral">{section.items.length} perguntas</Badge>
                  <Badge tone="primary">{sectionAverage.toFixed(1)}</Badge>
                  <span>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {section.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 'var(--font-size-sm)' }}>
                      <span>{item.text}</span>
                      <Badge tone="neutral">{result.responses[item.id]?.score ?? '—'}</Badge>
                    </div>
                  ))}
                  {result.sectionNotes[section.categoryId]?.observation && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      <strong>Observação:</strong> {result.sectionNotes[section.categoryId]?.observation}
                    </p>
                  )}
                  {result.sectionNotes[section.categoryId]?.improvementAction && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                      <strong>Ação combinada:</strong> {result.sectionNotes[section.categoryId]?.improvementAction}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="primary" onClick={onDone}>
        Concluir
      </Button>
    </div>
  );
}
