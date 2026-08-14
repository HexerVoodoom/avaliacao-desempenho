import type { EvaluationType, ScoreValue } from '@studio/domain';

/** One scoreable item inside a section (a statement, a dialogic question, or
 * an activity — the runner doesn't care which, only the scale/labels differ
 * per EvaluationType, via packages/domain/src/scales.ts). */
export interface RunnerItem {
  id: string; // competencyQuestion.id or roleActivity.id
  text: string;
  isDialogic: boolean; // affects whether keyword capture is shown
}

export interface RunnerSection {
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  items: RunnerItem[];
}

export interface ItemResponse {
  // Optional on purpose: a response record can exist (e.g. the evaluator
  // typed a keyword) before a score was ever chosen. Defaulting this to a
  // score value was a real bug — see EvaluationRunner.setKeyword.
  score?: ScoreValue;
  keywords?: [string, string, string];
}

export interface SectionNoteDraft {
  observation: string;
  improvementAction: string;
}

export interface RunnerResult {
  responses: Record<string, ItemResponse>; // by item id
  sectionNotes: Record<string, SectionNoteDraft>; // by categoryId
}

export const EVALUATION_TYPE_LABEL: Record<EvaluationType, string> = {
  dialogica: 'Dialógica',
  tradicional: 'Tradicional (Likert)',
  atividades: 'Por atividades',
};
