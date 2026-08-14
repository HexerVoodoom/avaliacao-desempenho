import type { EvaluationType, ScoreValue } from './types';

/** Label shown for each point of the 1–5 scale, per evaluation method. */
export const SCALE_LABELS: Record<EvaluationType, Record<ScoreValue, string>> = {
  dialogica: {
    1: 'Quase não funcionou',
    2: 'Funcionou pouco',
    3: 'Funcionou em parte',
    4: 'Funcionou bem',
    5: 'Funcionou muito bem',
  },
  tradicional: {
    1: 'Nunca',
    2: 'Raramente',
    3: 'Às vezes',
    4: 'Frequentemente',
    5: 'Sempre',
  },
  atividades: {
    1: 'Insuficiente',
    2: 'Regular',
    3: 'Bom',
    4: 'Muito bom',
    5: 'Excepcional',
  },
};

/** Legend shown on the result screen's overall-average card (0–5, method-agnostic). */
export const OVERALL_SCALE_LEGEND: Record<ScoreValue, string> = {
  5: 'As ações contribuíram expressivamente para o projeto.',
  4: 'As ações contribuíram bem para o projeto.',
  3: 'As ações contribuíram parcialmente para o projeto.',
  2: 'As ações contribuíram pouco para o projeto.',
  1: 'As ações quase não contribuíram para o projeto.',
};

/** Score at/above which a category is considered "good" — flips the
 * result-screen prompt from "o que posso fazer para melhorar" to
 * "o que posso fazer para manter". Kept as a constant (not per-org config)
 * until product asks for it to be tunable. */
export const IMPROVEMENT_VS_MAINTAIN_THRESHOLD = 4;

export function improvementPromptFor(categoryAverage: number): 'melhorar' | 'manter' {
  return categoryAverage >= IMPROVEMENT_VS_MAINTAIN_THRESHOLD ? 'manter' : 'melhorar';
}

export function average(scores: ScoreValue[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
