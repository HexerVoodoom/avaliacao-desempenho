import { describe, expect, it } from 'vitest';
import { average, improvementPromptFor, IMPROVEMENT_VS_MAINTAIN_THRESHOLD, SCALE_LABELS } from './scales';
import type { ScoreValue } from './types';

describe('average', () => {
  it('returns 0 for an empty list (no responses yet)', () => {
    expect(average([])).toBe(0);
  });

  it('averages a mix of scores', () => {
    const scores: ScoreValue[] = [1, 3, 5];
    expect(average(scores)).toBe(3);
  });

  it('handles a single score', () => {
    expect(average([4])).toBe(4);
  });
});

describe('improvementPromptFor', () => {
  it('prompts "melhorar" below the threshold', () => {
    expect(improvementPromptFor(IMPROVEMENT_VS_MAINTAIN_THRESHOLD - 0.1)).toBe('melhorar');
  });

  it('prompts "manter" at or above the threshold', () => {
    expect(improvementPromptFor(IMPROVEMENT_VS_MAINTAIN_THRESHOLD)).toBe('manter');
    expect(improvementPromptFor(5)).toBe('manter');
  });
});

describe('SCALE_LABELS', () => {
  it('has all 5 points defined for every evaluation type, with distinct wording', () => {
    for (const type of ['dialogica', 'tradicional', 'atividades'] as const) {
      const labels = SCALE_LABELS[type];
      const values = [1, 2, 3, 4, 5] as ScoreValue[];
      for (const v of values) {
        expect(labels[v]).toBeTruthy();
      }
      // Regression guard: this is what would break silently if someone
      // reused one method's labels for another (e.g. showing "Nunca...Sempre"
      // in the atividades flow, which uses "Insuficiente...Excepcional").
      expect(new Set(values.map((v) => labels[v])).size).toBe(5);
    }
  });
});
