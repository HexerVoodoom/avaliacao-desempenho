import * as React from 'react';
import type { Category, Competency } from '@studio/domain';
import { Button, Badge, PageHeader, Card, EmptyState, Field, Input, Select, Textarea, ListRowGroup } from '@studio/ui';
import { store } from '../store';

const DIALOGIC_TEMPLATE =
  'Pensando em [período/situações recentes], como você [ação relacionada à competência] e como avalia [efeito/resultado disso]?';

export function CompetenciesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [competencies, setCompetencies] = React.useState<Competency[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const refresh = React.useCallback(async () => {
    const [cats, comps] = await Promise.all([
      store.competencyLibrary.listCategories(),
      store.competencyLibrary.listCompetencies(),
    ]);
    setCategories(cats);
    setCompetencies(comps);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const byCategory = React.useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      const list = map.get(c.categoryId) ?? [];
      list.push(c);
      map.set(c.categoryId, list);
    }
    return map;
  }, [competencies]);

  function toggle(competencyId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(competencyId)) next.delete(competencyId);
      else next.add(competencyId);
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        title="Competências"
        description="Biblioteca global — usada por todos os cargos, de qualquer cliente."
        actions={
          !creating && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              Nova competência
            </Button>
          )
        }
      />

      {creating && (
        <NewCompetencyForm
          categories={categories}
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            refresh();
          }}
        />
      )}

      {!creating && categories.length === 0 && (
        <EmptyState title="Nenhuma competência cadastrada ainda" description="Crie a primeira competência da biblioteca." />
      )}

      {!creating &&
        categories.map((cat) => (
          <section key={cat.id} className="mb-[var(--space-8)]">
            <h2 className="mb-[var(--space-1)] text-[length:var(--font-size-lg)] font-[var(--font-weight-semibold)] tracking-[var(--letter-spacing-tight)]">
              {cat.name}
            </h2>
            <p className="mb-[var(--space-3)] text-[length:var(--font-size-sm)] text-[var(--color-text-muted)]">
              {cat.description}
            </p>

            {(byCategory.get(cat.id) ?? []).length === 0 ? (
              <EmptyState title="Nenhuma competência neste bloco ainda" />
            ) : (
              <Card padded={false}>
                <ListRowGroup>
                  {(byCategory.get(cat.id) ?? []).map((comp) => {
                    const isOpen = expanded.has(comp.id);
                    const dialogic = comp.questions.find((q) => q.type === 'dialogic');
                    const statements = comp.questions
                      .filter((q) => q.type === 'statement')
                      .sort((a, b) => a.order - b.order);
                    return (
                      <li key={comp.id} className="border-t border-[var(--color-border)] first:border-t-0">
                        <button
                          type="button"
                          onClick={() => toggle(comp.id)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] text-left hover:bg-[var(--color-surface-muted)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                        >
                          <span className="flex items-center gap-[var(--space-2)] min-w-0">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden
                              className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            >
                              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="truncate text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                              {comp.name}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-[var(--space-2)]">
                            <Badge tone="neutral">{statements.length} afirmações</Badge>
                            <Badge tone="warning">{dialogic ? 1 : 0} base de diálogo</Badge>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-4)] pb-[var(--space-4)] pl-[calc(var(--space-4)+22px)]">
                            {dialogic && (
                              <div>
                                <div className="mb-[var(--space-1)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[var(--color-text-muted)]">
                                  Base de diálogo
                                </div>
                                <p className="m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-base)]">{dialogic.text}</p>
                              </div>
                            )}
                            {statements.length > 0 && (
                              <div>
                                <div className="mb-[var(--space-1)] text-[length:var(--font-size-xs)] font-[var(--font-weight-semibold)] uppercase tracking-wide text-[var(--color-text-muted)]">
                                  Afirmações (escala Likert)
                                </div>
                                <ul className="m-0 flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-4)] text-[length:var(--font-size-sm)] leading-[var(--line-height-base)]">
                                  {statements.map((s) => (
                                    <li key={s.id}>{s.text}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ListRowGroup>
              </Card>
            )}
          </section>
        ))}
    </div>
  );
}

interface NewCompetencyFormProps {
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
}

function NewCompetencyForm({ categories, onCancel, onSaved }: NewCompetencyFormProps) {
  const [name, setName] = React.useState('');
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? '');
  const [dialogicText, setDialogicText] = React.useState('');
  const [statements, setStatements] = React.useState<string[]>(['']);

  function updateStatement(i: number, value: string) {
    setStatements((prev) => prev.map((s, idx) => (idx === i ? value : s)));
  }

  function addStatement() {
    setStatements((prev) => [...prev, '']);
  }

  function removeStatement(i: number) {
    setStatements((prev) => prev.filter((_, idx) => idx !== i));
  }

  const validStatements = statements.map((s) => s.trim()).filter(Boolean);
  const canSave = name.trim().length > 0 && categoryId && dialogicText.trim().length > 0 && validStatements.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    await store.competencyLibrary.addCompetency({
      categoryId,
      name: name.trim(),
      dialogicText: dialogicText.trim(),
      statementTexts: validStatements,
    });
    onSaved();
  }

  return (
    <Card as="form" onSubmit={handleSubmit} className="mb-[var(--space-8)] flex max-w-[560px] flex-col gap-[var(--space-4)]">
      <div className="flex gap-[var(--space-3)]">
        <Field label="Nome da competência">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Bloco temático">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Base de diálogo (pergunta aberta)" hint={`Modelo sugerido: ${DIALOGIC_TEMPLATE}`}>
        <Textarea
          value={dialogicText}
          onChange={(e) => setDialogicText(e.target.value)}
          placeholder={DIALOGIC_TEMPLATE}
          required
        />
      </Field>

      <div>
        <div className="mb-[var(--space-2)] text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)]">
          Afirmações técnicas (escala Likert)
        </div>
        {statements.map((s, i) => (
          <div key={i} className="mb-[var(--space-2)] flex gap-[var(--space-2)]">
            <Input
              className="flex-1"
              value={s}
              onChange={(e) => updateStatement(i, e.target.value)}
              placeholder="ex.: Realiza suas tarefas com autonomia."
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeStatement(i)} disabled={statements.length === 1}>
              remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={addStatement}>
          + Adicionar afirmação
        </Button>
      </div>

      <div className="flex gap-[var(--space-2)]">
        <Button type="submit" variant="primary" disabled={!canSave}>
          Salvar competência
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
