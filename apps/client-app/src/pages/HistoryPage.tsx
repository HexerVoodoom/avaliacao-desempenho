import * as React from 'react';
import type { Category, Competency, Evaluation, EvaluationSectionNote, Member, Organization } from '@studio/domain';
import { average } from '@studio/domain';
import { Badge, PageHeader, Card, EmptyState, Field, Select, ListRowGroup, ListRow } from '@studio/ui';
import { store } from '../store';
import { categorizeEvaluation } from '../evaluation/categorize';
import { EVALUATION_TYPE_LABEL } from '../evaluation/types';

interface HistoryPageProps {
  organization: Organization;
}

interface Commitment {
  evaluationId: string;
  evaluationDate: string;
  categoryId: string;
  categoryName: string;
  action: string;
  averageAtTheTime: number;
  followUpAverage?: number;
  status: 'cumprido' | 'nao-cumprido' | 'aguardando';
}

export function HistoryPage({ organization }: HistoryPageProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [memberId, setMemberId] = React.useState('');
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [competencies, setCompetencies] = React.useState<Competency[]>([]);

  React.useEffect(() => {
    Promise.all([
      store.members.list(organization.id),
      store.competencyLibrary.listCategories(),
      store.competencyLibrary.listCompetencies(),
    ]).then(([m, cats, comps]) => {
      setMembers(m);
      setCategories(cats);
      setCompetencies(comps);
      if (m[0]) setMemberId(m[0].id);
    });
  }, [organization.id]);

  React.useEffect(() => {
    if (!memberId) return;
    store.evaluations
      .list(organization.id, { memberId, status: 'completed' })
      .then((evs) => setEvaluations(evs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))));
  }, [organization.id, memberId]);

  const perEvaluation = React.useMemo(
    () => evaluations.map((ev) => ({ evaluation: ev, byCategory: categorizeEvaluation(ev, categories, competencies) })),
    [evaluations, categories, competencies]
  );

  // categoryId -> [{ date, average }] across all evaluations, in chronological order
  const trendByCategory = React.useMemo(() => {
    const map = new Map<string, { categoryName: string; points: { date: string; average: number }[] }>();
    for (const { evaluation, byCategory } of perEvaluation) {
      for (const cat of byCategory) {
        const entry = map.get(cat.categoryId) ?? { categoryName: cat.categoryName, points: [] };
        entry.points.push({ date: evaluation.createdAt, average: average(cat.scores) });
        map.set(cat.categoryId, entry);
      }
    }
    return map;
  }, [perEvaluation]);

  // Combinados: every sectionNote with an improvementAction, matched against
  // the next evaluation that has scores for that same category to decide if
  // it was followed through.
  const commitments = React.useMemo<Commitment[]>(() => {
    const result: Commitment[] = [];
    perEvaluation.forEach(({ evaluation, byCategory }, index) => {
      const notes: EvaluationSectionNote[] = evaluation.sectionNotes.filter((n) => n.improvementAction);
      for (const note of notes) {
        const current = byCategory.find((c) => c.categoryId === note.categoryId);
        if (!current) continue;
        const currentAverage = average(current.scores);

        let followUp: { evaluation: Evaluation; average: number } | undefined;
        for (let i = index + 1; i < perEvaluation.length; i++) {
          const laterEntry = perEvaluation[i];
          if (!laterEntry) continue;
          const later = laterEntry.byCategory.find((c) => c.categoryId === note.categoryId);
          if (later) {
            followUp = { evaluation: laterEntry.evaluation, average: average(later.scores) };
            break;
          }
        }

        result.push({
          evaluationId: evaluation.id,
          evaluationDate: evaluation.createdAt,
          categoryId: note.categoryId,
          categoryName: current.categoryName,
          action: note.improvementAction!,
          averageAtTheTime: currentAverage,
          followUpAverage: followUp?.average,
          status: !followUp ? 'aguardando' : followUp.average >= currentAverage ? 'cumprido' : 'nao-cumprido',
        });
      }
    });
    return result.reverse(); // most recent first
  }, [perEvaluation]);

  return (
    <div>
      <PageHeader title="Histórico e Comparação" />

      <Field label="Membro" className="mb-[var(--space-6)] max-w-[320px]">
        <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </Select>
      </Field>

      {evaluations.length === 0 && (
        <EmptyState
          title="Nenhuma avaliação concluída para este membro ainda"
          description="Assim que uma avaliação for concluída, o histórico e a evolução por categoria aparecem aqui."
        />
      )}

      {evaluations.length > 0 && (
        <>
          <h2 className="mb-[var(--space-2)] text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
            Evolução por categoria
          </h2>
          <div className="mb-[var(--space-8)] flex flex-col gap-[var(--space-3)]">
            {Array.from(trendByCategory.entries()).map(([categoryId, { categoryName, points }]) => (
              <Card key={categoryId}>
                <strong className="text-[length:var(--font-size-sm)]">{categoryName}</strong>
                <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-2)]">
                  {points.map((p, i) => {
                    const prev = points[i - 1];
                    const trend = prev ? (p.average > prev.average ? '↑' : p.average < prev.average ? '↓' : '→') : '';
                    return (
                      <Badge key={i} tone={trend === '↑' ? 'success' : trend === '↓' ? 'danger' : 'neutral'}>
                        {new Date(p.date).toLocaleDateString('pt-BR')}: {p.average.toFixed(1)} {trend}
                      </Badge>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <h2 className="mb-[var(--space-2)] text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
            Combinados (ações de melhoria)
          </h2>
          <div className="mb-[var(--space-8)] flex flex-col gap-[var(--space-2)]">
            {commitments.length === 0 ? (
              <EmptyState title="Nenhum combinado registrado ainda" />
            ) : (
              commitments.map((c, i) => (
                <Card key={i}>
                  <div className="mb-[var(--space-1)] flex items-center justify-between gap-[var(--space-2)]">
                    <span className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
                      {c.categoryName} · {new Date(c.evaluationDate).toLocaleDateString('pt-BR')}
                    </span>
                    <Badge tone={c.status === 'cumprido' ? 'success' : c.status === 'nao-cumprido' ? 'danger' : 'neutral'}>
                      {c.status === 'cumprido' ? 'Cumprido' : c.status === 'nao-cumprido' ? 'Não cumprido' : 'Aguardando próxima avaliação'}
                    </Badge>
                  </div>
                  <p className="m-0 text-[length:var(--font-size-sm)]">{c.action}</p>
                  {c.followUpAverage !== undefined && (
                    <p className="m-0 mt-[var(--space-1)] text-[length:var(--font-size-xs)] text-[var(--color-text-muted)]">
                      Média na época: {c.averageAtTheTime.toFixed(1)} → próxima avaliação: {c.followUpAverage.toFixed(1)}
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>

          <h2 className="mb-[var(--space-2)] text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
            Avaliações deste membro
          </h2>
          <Card padded={false}>
            <ListRowGroup>
              {[...evaluations].reverse().map((ev) => (
                <ListRow
                  key={ev.id}
                  title={new Date(ev.createdAt).toLocaleDateString('pt-BR')}
                  actions={
                    <>
                      <Badge tone="neutral">{EVALUATION_TYPE_LABEL[ev.type]}</Badge>
                      <Badge tone="primary">{average(ev.responses.map((r) => r.score)).toFixed(1)}/5</Badge>
                    </>
                  }
                />
              ))}
            </ListRowGroup>
          </Card>
        </>
      )}
    </div>
  );
}
