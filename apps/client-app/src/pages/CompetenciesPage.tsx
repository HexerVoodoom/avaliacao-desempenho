import * as React from 'react';
import type { Category, Competency } from '@studio/domain';
import { Button, Badge } from '@studio/ui';
import { store } from '../store';

const DIALOGIC_TEMPLATE =
  'Pensando em [período/situações recentes], como você [ação relacionada à competência] e como avalia [efeito/resultado disso]?';

export function CompetenciesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [competencies, setCompetencies] = React.useState<Competency[]>([]);
  const [creating, setCreating] = React.useState(false);

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Competências</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Biblioteca global — usada por todos os cargos, de qualquer cliente.
          </p>
        </div>
        {!creating && (
          <Button variant="primary" onClick={() => setCreating(true)}>
            Nova competência
          </Button>
        )}
      </div>

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

      {!creating &&
        categories.map((cat) => (
          <section key={cat.id} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 4 }}>{cat.name}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>
              {cat.description}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(byCategory.get(cat.id) ?? []).map((comp) => (
                <li
                  key={comp.id}
                  style={{
                    padding: 12,
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-base)',
                  }}
                >
                  <strong>{comp.name}</strong>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Badge tone="neutral">
                      {comp.questions.filter((q) => q.type === 'statement').length} afirmações
                    </Badge>
                    <Badge tone="warning">
                      {comp.questions.filter((q) => q.type === 'dialogic').length} base de diálogo
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560, marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <label style={fieldLabelStyle}>
          Nome da competência
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label style={fieldLabelStyle}>
          Bloco temático
          <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label style={fieldLabelStyle}>
        Base de diálogo (pergunta aberta)
        <textarea
          style={{ ...inputStyle, minHeight: 60 }}
          value={dialogicText}
          onChange={(e) => setDialogicText(e.target.value)}
          placeholder={DIALOGIC_TEMPLATE}
          required
        />
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Modelo sugerido: {DIALOGIC_TEMPLATE}
        </span>
      </label>

      <div>
        <label style={{ ...fieldLabelStyle, marginBottom: 4 }}>Afirmações técnicas (escala Likert)</label>
        {statements.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
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

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" variant="primary" disabled={!canSave}>
          Salvar competência
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
  flex: 1,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
  fontFamily: 'inherit',
};
