import type { Category, Competency, EvaluationType, Role } from '@studio/domain';
import type { RunnerSection } from './types';

/** Turns a role's selected competency questions (or its activities) into the
 * section list the runner walks through, one block/category at a time — see
 * docs/PLANO.md §3.4. Dialógica only surfaces dialogic questions, Tradicional
 * only statements; a competência with none selected for this evaluation type
 * simply contributes nothing (not an error — the role owner chose not to
 * evaluate it that way). */
export function buildSections(
  evaluationType: EvaluationType,
  role: Role,
  categories: Category[],
  competencies: Competency[]
): RunnerSection[] {
  if (evaluationType === 'atividades') {
    if (role.activities.length === 0) return [];
    return [
      {
        categoryId: 'atividades',
        categoryName: 'Atividades do cargo',
        items: [...role.activities]
          .sort((a, b) => a.order - b.order)
          .map((a) => ({ id: a.id, text: a.text, isDialogic: false })),
      },
    ];
  }

  const wantedQuestionType = evaluationType === 'dialogica' ? 'dialogic' : 'statement';
  const competencyById = new Map(competencies.map((c) => [c.id, c]));
  const sections: RunnerSection[] = [];

  for (const category of categories) {
    const items: RunnerSection['items'] = [];
    for (const link of role.competencyLinks) {
      const competency = competencyById.get(link.competencyId);
      if (!competency || competency.categoryId !== category.id) continue;
      for (const question of competency.questions) {
        if (question.type !== wantedQuestionType) continue;
        if (!link.selectedQuestionIds.includes(question.id)) continue;
        items.push({ id: question.id, text: question.text, isDialogic: question.type === 'dialogic' });
      }
    }
    if (items.length > 0) {
      sections.push({
        categoryId: category.id,
        categoryName: category.name,
        categoryDescription: category.description,
        items,
      });
    }
  }

  return sections;
}
