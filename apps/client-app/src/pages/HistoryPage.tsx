import * as React from 'react';
import type { Category, Competency, Evaluation, EvaluationSectionNote, Member, Organization } from '@studio/domain';
import { average } from '@studio/domain';
import { Badge } from '@studio/ui';
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
      <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 16 }}>Histórico e Comparação</h1>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 24, maxWidth: 320 }}>
        Membro
        <select style={inputStyle} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName}
            </option>
          ))}
        </select>
      </label>

      {evaluations.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma avaliação concluída para este membro ainda.</p>
      )}

      {evaluations.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>Evolução por categoria</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {Array.from(trendByCategory.entries()).map(([categoryId, { categoryName, points }]) => (
              <div key={categoryId} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)' }}>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>{categoryName}</strong>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {points.map((p, i) => {
                    const prev = points[i - 1];
                    const trend = prev ? (p.average > prev.average ? '↑' : p.average < prev.average ? '↓' : '→') : '';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Badge tone={trend === '↑' ? 'success' : trend === '↓' ? 'danger' : 'neutral'}>
                          {new Date(p.date).toLocaleDateString('pt-BR')}: {p.average.toFixed(1)} {trend}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>Combinados (ações de melhoria)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {commitments.map((c, i) => (
              <div key={i} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    {c.categoryName} · {new Date(c.evaluationDate).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge tone={c.status === 'cumprido' ? 'success' : c.status === 'nao-cumprido' ? 'danger' : 'neutral'}>
                    {c.status === 'cumprido' ? 'Cumprido' : c.status === 'nao-cumprido' ? 'Não cumprido' : 'Aguardando próxima avaliação'}
                  </Badge>
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>{c.action}</p>
                {c.followUpAverage !== undefined && (
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Média na época: {c.averageAtTheTime.toFixed(1)} → próxima avaliação: {c.followUpAverage.toFixed(1)}
                  </p>
                )}
              </div>
            ))}
            {commitments.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>Nenhum combinado registrado ainda.</p>}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>Avaliações deste membro</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...evaluations].reverse().map((ev) => (
              <li key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-base)' }}>
                <span>{new Date(ev.createdAt).toLocaleDateString('pt-BR')}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Badge tone="neutral">{EVALUATION_TYPE_LABEL[ev.type]}</Badge>
                  <Badge tone="primary">{average(ev.responses.map((r) => r.score)).toFixed(1)}/5</Badge>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
};
