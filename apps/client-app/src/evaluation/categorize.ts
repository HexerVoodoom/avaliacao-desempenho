import type { Category, Competency, Evaluation, ScoreValue } from '@studio/domain';

export interface CategoryScores {
  categoryId: string;
  categoryName: string;
  scores: ScoreValue[];
}

/** Re-derives which category each response in a (possibly old) evaluation
 * belongs to, by walking competency questions — the evaluation itself only
 * stores targetId + score, not category, so history views need to look this
 * up against the current library state. Activities (type 'atividades') have
 * no category breakdown, so they're grouped under a single 'atividades'
 * bucket instead. */
export function categorizeEvaluation(
  evaluation: Evaluation,
  categories: Category[],
  competencies: Competency[]
): CategoryScores[] {
  const questionToCategory = new Map<string, string>();
  for (const c of competencies) {
    for (const q of c.questions) {
      questionToCategory.set(q.id, c.categoryId);
    }
  }

  const byCategory = new Map<string, ScoreValue[]>();

  if (evaluation.type === 'atividades') {
    const scores = evaluation.responses.map((r) => r.score);
    if (scores.length > 0) byCategory.set('atividades', scores);
  } else {
    for (const response of evaluation.responses) {
      const categoryId = questionToCategory.get(response.targetId);
      if (!categoryId) continue;
      const list = byCategory.get(categoryId) ?? [];
      list.push(response.score);
      byCategory.set(categoryId, list);
    }
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));
  categoryNameById.set('atividades', 'Atividades do cargo');

  return Array.from(byCategory.entries()).map(([categoryId, scores]) => ({
    categoryId,
    categoryName: categoryNameById.get(categoryId) ?? categoryId,
    scores,
  }));
}
