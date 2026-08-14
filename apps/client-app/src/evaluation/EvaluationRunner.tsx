import * as React from 'react';
import type { EvaluationType, ScoreValue } from '@studio/domain';
import { SCALE_LABELS, improvementPromptFor, average } from '@studio/domain';
import { Button, Badge, ConfirmDialog } from '@studio/ui';
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

/** WAI-ARIA Radio Group pattern: exactly one tab stop in the group (the
 * selected option, or the first option when nothing is selected yet),
 * arrow keys move focus+selection between options. Previously each score
 * button was its own tab stop — role="radiogroup" told screen readers to
 * "use the arrow keys", but the arrow keys did nothing. Flagged by the
 * design-critic review of the ProdSquad wireframe pass. */
function ScoreRadioGroup({
  itemText,
  value,
  onChange,
  scaleLabels,
}: {
  itemText: string;
  value: ScoreValue | undefined;
  onChange: (score: ScoreValue) => void;
  scaleLabels: Record<ScoreValue, string>;
}) {
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  function focusIndex(index: number) {
    const clamped = (index + SCORES.length) % SCORES.length;
    buttonRefs.current[clamped]?.focus();
  }

  function scoreAt(index: number): ScoreValue {
    return SCORES[(index + SCORES.length) % SCORES.length]!;
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        onChange(scoreAt(index + 1));
        focusIndex(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        onChange(scoreAt(index - 1));
        focusIndex(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        onChange(scoreAt(0));
        focusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        onChange(scoreAt(SCORES.length - 1));
        focusIndex(SCORES.length - 1);
        break;
      default:
        break;
    }
  }

  const selectedIndex = value ? SCORES.indexOf(value) : -1;

  return (
    <div role="radiogroup" aria-label={`Nota para: ${itemText}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SCORES.map((score, index) => {
        const selected = value === score;
        // Roving tabindex: only the selected option (or the first, if none
        // selected yet) is a tab stop — arrow keys move within the group.
        const isTabStop = selectedIndex === -1 ? index === 0 : selected;
        return (
          <button
            key={score}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={isTabStop ? 0 : -1}
            onClick={() => onChange(score)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `2px solid ${selected ? SCORE_COLOR[score] : 'var(--color-border)'}`,
              background: selected ? SCORE_COLOR[score] : 'var(--color-surface)',
              color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {score} — {scaleLabels[score]}
          </button>
        );
      })}
    </div>
  );
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function EvaluationRunner({ evaluationType, sections, onFinish, onCancel }: EvaluationRunnerProps) {
  const [sectionIndex, setSectionIndex] = React.useState(0);
  // The furthest section the evaluator has reached — dots up to this index
  // are navigable so a mis-tap on tablet can be corrected without
  // discarding the whole session (previously the only way back was
  // "Cancelar avaliação", losing every answer — a P0 usability gap for a
  // live, in-person flow).
  const [maxVisitedIndex, setMaxVisitedIndex] = React.useState(0);
  const [result, setResult] = React.useState<RunnerResult>({ responses: {}, sectionNotes: {} });
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  const section = sections[sectionIndex];
  const scaleLabels = SCALE_LABELS[evaluationType];
  const isLastSection = sectionIndex === sections.length - 1;

  const announceRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (section) {
      // aria-live region announces the section change to screen readers —
      // the "Seção X de Y" text and dots are the sighted-user equivalent.
      announceRef.current?.replaceChildren(
        document.createTextNode(`Seção ${sectionIndex + 1} de ${sections.length}: ${section.categoryName}`),
      );
    }
  }, [sectionIndex, section, sections.length]);

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

  function isItemAnswered(itemId: string) {
    return result.responses[itemId]?.score !== undefined;
  }

  const answeredCount = section.items.filter((item) => isItemAnswered(item.id)).length;
  const allAnswered = answeredCount === section.items.length;
  const allSectionsAnswered = sections.every((s) => s.items.every((item) => isItemAnswered(item.id)));
  const hasProgress = Object.values(result.responses).some((r) => r.score !== undefined || (r.keywords ?? []).some(Boolean));

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
          // No `?? 3` fallback here anymore: typing a keyword before
          // touching a score button used to silently record score 3 —
          // no button ever showed as selected, but the average and the
          // final result screen picked up a note nobody chose. Score
          // stays undefined until the evaluator actually taps one.
          [itemId]: { score: prev.responses[itemId]?.score, keywords: next },
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

  const definedScores = section.items
    .map((i) => result.responses[i.id]?.score)
    .filter((s): s is ScoreValue => s !== undefined);
  const sectionAverage = definedScores.length > 0 ? average(definedScores) : 0;
  const promptKind = sectionAverage > 0 ? improvementPromptFor(sectionAverage) : 'melhorar';

  function goToSection(index: number) {
    if (index < 0 || index > maxVisitedIndex) return;
    setSectionIndex(index);
  }

  function goNext() {
    if (isLastSection) {
      if (allSectionsAnswered) onFinish(result);
      return;
    }
    const nextIndex = sectionIndex + 1;
    setSectionIndex(nextIndex);
    setMaxVisitedIndex((prev) => Math.max(prev, nextIndex));
  }

  function goPrevious() {
    goToSection(sectionIndex - 1);
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
    <div style={{ maxWidth: 640 }}>
      <div ref={announceRef} role="status" aria-live="polite" style={visuallyHiddenStyle} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Seção {sectionIndex + 1} de {sections.length}
        </span>
        <div role="tablist" aria-label="Navegar entre seções" style={{ display: 'flex', gap: 6 }}>
          {sections.map((s, index) => {
            const visited = index <= maxVisitedIndex;
            const current = index === sectionIndex;
            return (
              <button
                key={s.categoryId}
                type="button"
                role="tab"
                aria-selected={current}
                aria-current={current || undefined}
                aria-label={`Ir para seção ${index + 1}: ${s.categoryName}${visited ? '' : ' (ainda não disponível)'}`}
                disabled={!visited}
                onClick={() => goToSection(index)}
                style={{
                  width: 12,
                  height: 12,
                  padding: 0,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: visited ? 'pointer' : 'default',
                  background: current
                    ? 'var(--color-primary)'
                    : visited
                      ? 'var(--color-text-muted)'
                      : 'var(--color-border)',
                }}
              />
            );
          })}
        </div>
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
                      aria-label={`Palavra-chave ${i + 1} para: ${item.text}`}
                      value={response?.keywords?.[i] ?? ''}
                      onChange={(e) => setKeyword(item.id, i as 0 | 1 | 2, e.target.value)}
                    />
                  ))}
                </div>
              )}

              <ScoreRadioGroup
                itemText={item.text}
                value={response?.score}
                onChange={(score) => setScore(item.id, score)}
                scaleLabels={scaleLabels}
              />
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
        <Button variant="ghost" onClick={requestCancel}>
          Cancelar avaliação
        </Button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sectionIndex > 0 && (
            <Button variant="ghost" onClick={goPrevious}>
              Seção anterior
            </Button>
          )}
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {answeredCount}/{section.items.length} respondidas
          </span>
          <Button
            variant="primary"
            onClick={goNext}
            disabled={isLastSection ? !allSectionsAnswered : !allAnswered}
            title={isLastSection && !allSectionsAnswered ? 'Responda todas as seções antes de finalizar' : undefined}
          >
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
