import * as React from 'react';
import { Button, Badge, validatePalette, type DesignTokenPalette, type ContrastCheck } from '@studio/ui';
import type { EvaluationType } from '@studio/domain';

/**
 * Implements docs/design.md.template as a real form instead of a document a
 * human fills by hand. §2 (paleta) is gated live by the WCAG validator from
 * packages/ui/src/lib/contrast.ts — publishing is blocked until every pair
 * passes, per §8 ("checklist de aceite antes de publicar").
 *
 * NOTE: persistence to Supabase is intentionally NOT wired yet — the hosted
 * project was paused pending cost approval (US$10/mês). onSubmit currently
 * receives the fully-validated payload and logs it; swap the body for an
 * `organizations` insert once a project exists. Nothing about the form or
 * validation logic changes when that happens.
 */

const EVALUATION_TYPES: { value: EvaluationType; label: string }[] = [
  { value: 'dialogica', label: 'Dialógica' },
  { value: 'tradicional', label: 'Tradicional (Likert)' },
  { value: 'atividades', label: 'Por atividades' },
];

const DEFAULT_PALETTE: DesignTokenPalette = {
  colorPrimary: '#6155f5',
  colorSecondary: '#34d399',
  colorSuccess: '#22c55e',
  colorWarning: '#f59e0b',
  colorDanger: '#ef4444',
  colorSurface: '#ffffff',
  colorSurfaceMuted: '#f4f4f6',
  colorTextPrimary: '#111114',
  colorTextMuted: '#6b6b76',
};

export interface NewOrganizationPayload {
  name: string;
  slug: string;
  palette: DesignTokenPalette;
  roleTypes: string[];
  enabledEvaluationTypes: EvaluationType[];
}

export interface NewOrganizationFormProps {
  onSubmit: (payload: NewOrganizationPayload) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function NewOrganizationForm({ onSubmit }: NewOrganizationFormProps) {
  const [name, setName] = React.useState('');
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [slug, setSlug] = React.useState('');
  const [palette, setPalette] = React.useState<DesignTokenPalette>(DEFAULT_PALETTE);
  const [roleTypes, setRoleTypes] = React.useState<string[]>(['liderança', 'associado']);
  const [customRoleType, setCustomRoleType] = React.useState('');
  const [enabledTypes, setEnabledTypes] = React.useState<EvaluationType[]>([
    'dialogica',
    'tradicional',
    'atividades',
  ]);

  const checks: ContrastCheck[] = React.useMemo(() => validatePalette(palette), [palette]);
  const paletteOk = checks.every((c) => c.passes);
  const canPublish = name.trim().length > 0 && slug.trim().length > 0 && paletteOk && roleTypes.length > 0 && enabledTypes.length > 0;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleRoleType(type: string) {
    setRoleTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function toggleEvalType(type: EvaluationType) {
    setEnabledTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function addCustomRoleType() {
    const trimmed = customRoleType.trim();
    if (trimmed && !roleTypes.includes(trimmed)) {
      setRoleTypes((prev) => [...prev, trimmed]);
    }
    setCustomRoleType('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) return;
    onSubmit({ name: name.trim(), slug: slug.trim(), palette, roleTypes, enabledEvaluationTypes: enabledTypes });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      <section>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>1. Marca</h2>
        <label style={fieldLabelStyle}>
          Nome do cliente
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="ex.: NOSSA Arquitetura"
            required
          />
        </label>
        <label style={fieldLabelStyle}>
          Slug (URL/subdomínio)
          <input
            style={inputStyle}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="ex.: nossa"
            required
          />
        </label>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>2. Paleta</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(Object.keys(palette) as (keyof DesignTokenPalette)[]).map((key) => (
            <label key={key} style={fieldLabelStyle}>
              {key}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value }))}
                  style={{ width: 40, height: 32, padding: 0, border: 'none', background: 'none' }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={palette[key]}
                  onChange={(e) => setPalette((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {checks.map((check) => (
            <div key={check.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-sm)' }}>
              <Badge tone={check.passes ? 'success' : 'danger'}>
                {check.passes ? 'AA ✓' : 'AA ✗'}
              </Badge>
              <span>
                {check.label} — {check.ratio}:1 (mínimo {check.minRatio}:1)
              </span>
            </div>
          ))}
          {!paletteOk && (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)' }}>
              Ajuste as cores acima até todos os pares passarem — publicação bloqueada até então.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>6. Taxonomia de cargos</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {roleTypes.map((type) => (
            <Badge key={type} tone="primary" onClick={() => toggleRoleType(type)} style={{ cursor: 'pointer' }}>
              {type} ✕
            </Badge>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={inputStyle}
            value={customRoleType}
            onChange={(e) => setCustomRoleType(e.target.value)}
            placeholder="ex.: terceirizado"
          />
          <Button type="button" variant="secondary" onClick={addCustomRoleType}>
            Adicionar
          </Button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>7. Métodos de avaliação habilitados</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {EVALUATION_TYPES.map(({ value, label }) => (
            <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={enabledTypes.includes(value)}
                onChange={() => toggleEvalType(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <Button type="submit" variant="primary" disabled={!canPublish}>
        Publicar cliente
      </Button>
    </form>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-muted)',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-surface)',
};
