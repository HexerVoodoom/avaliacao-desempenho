import * as React from 'react';
import type { EvaluationType, ScoreValue } from '@studio/domain';
import { SCALE_LABELS, improvementPromptFor, average } from '@studio/domain';
import { Button, Badge } from '@studio/ui';
import type { RunnerResult, RunnerSection, SectionNoteDraft } from './types';

interface EvaluationRunnerProps {
  evaluationType: EvaluationType;
  sections: RunnerSection[];
  onFinish: (result: RunnerResult) => void;
  onCancel: () => void;
}

const SCORES: ScoreValue[] = [1, 2, 3, 4, 5];

export function EvaluationRunner({ evaluationType, sections, onFinish, onCancel }: EvaluationRunnerProps) {
  const [sectionIndex, setSectionIndex] = React.useState(0);
  const [result, setResult] = React.useState<RunnerResult>({ responses: {}, sectionNotes: {} });

  const section = sections[sectionIndex];
  const scaleLabels = SCALE_LABELS[evaluationType];
  const isLastSection = sectionIndex === sections.length - 1;

  if (!section) {
    return (
      <div>
        <p style={{ color: 'var(--color-text-muted)' }}>
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

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 4, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Seção {sectionIndex + 1} de {sections.length}
      </div>
      <h2 style={{ fontSize: 'var(--font-size-xl)' }}>{section.categoryName}</h2>
      {section.categoryDescription && (
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>{section.categoryDescription}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {section.items.map((item) => {
          const response = result.responses[item.id];
          return (
            <div key={item.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)' }}>
              <p style={{ marginBottom: 12 }}>{item.text}</p>

              {item.isDialogic && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {[0, 1, 2].map((i) => (
                    <input
                      key={i}
                      style={inputStyle}
                      placeholder={`Palavra-chave ${i + 1}`}
                      value={response?.keywords?.[i] ?? ''}
                      onChange={(e) => setKeyword(item.id, i as 0 | 1 | 2, e.target.value)}
                    />
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SCORES.map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setScore(item.id, score)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: response?.score === score ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: response?.score === score ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: response?.score === score ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {score} — {scaleLabels[score]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {section.categoryId !== 'atividades' && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={fieldLabelStyle}>
            Observação da seção
            <textarea
              style={{ ...inputStyle, minHeight: 60 }}
              value={result.sectionNotes[section.categoryId]?.observation ?? ''}
              onChange={(e) => setNote(section.categoryId, { observation: e.target.value })}
              placeholder="Qualquer coisa importante observada nesta seção..."
            />
          </label>
          <label style={fieldLabelStyle}>
            {promptKind === 'melhorar' ? 'O que posso fazer para melhorar?' : 'O que posso fazer para manter?'}
            {sectionAverage > 0 && <Badge tone="neutral">média da seção: {sectionAverage.toFixed(1)}</Badge>}
            <textarea
              style={{ ...inputStyle, minHeight: 60 }}
              value={result.sectionNotes[section.categoryId]?.improvementAction ?? ''}
              onChange={(e) => setNote(section.categoryId, { improvementAction: e.target.value })}
            />
          </label>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar avaliação
        </Button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {answeredCount}/{section.items.length} respondidas
          </span>
          <Button variant="primary" onClick={goNext} disabled={!allAnswered}>
            {isLastSection ? 'Finalizar avaliação' : 'Próxima seção'}
          </Button>
        </div>
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
  fontFamily: 'inherit',
};
