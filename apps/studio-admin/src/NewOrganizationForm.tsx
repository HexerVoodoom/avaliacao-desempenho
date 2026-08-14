import * as React from 'react';
import { Button, Badge, validatePalette, applyDesignTokens, type DesignTokenPalette, type ContrastCheck } from '@studio/ui';
import type { EvaluationType } from '@studio/domain';

/**
 * Implements docs/design.md.template as a real form instead of a document a
 * human fills by hand. §2 (paleta) is gated live by the WCAG validator from
 * packages/ui/src/lib/contrast.ts — publishing is blocked until every pair
 * passes, per §8 ("checklist de aceite antes de publicar"). §1 (logo) and
 * §3/§4 (tipografia/forma) now feed a live preview panel so whoever is
 * onboarding a client sees the actual skin before publishing, not just hex
 * codes — closing the gap noted in docs/PLANO.md §7.
 */

const EVALUATION_TYPES: { value: EvaluationType; label: string }[] = [
  { value: 'dialogica', label: 'Dialógica' },
  { value: 'tradicional', label: 'Tradicional (Likert)' },
  { value: 'atividades', label: 'Por atividades' },
];

const FONT_OPTIONS = ['Inter', 'system-ui', 'Georgia', 'Roboto', 'Poppins'];

// Every default here passes its own WCAG AA check out of the box (verified
// against packages/ui/src/lib/contrast.ts) — a first-time user filling this
// form and clicking straight through to "Publicar cliente" without touching
// a single color must not hit a validator failure they didn't cause. The
// lighter Tailwind-ish "brand" shades (secondary/success/warning) fail at
// this text-on-white weight, so these are the darker 700/800-ish variants.
const DEFAULT_PALETTE: DesignTokenPalette = {
  colorPrimary: '#6155f5',
  colorSecondary: '#0f766e',
  colorSuccess: '#15803d',
  colorWarning: '#b45309',
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
  logoUrl?: string;
  fontFamily: string;
  radiusBase: string;
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
  const [logoUrl, setLogoUrl] = React.useState<string | undefined>();
  const [logoError, setLogoError] = React.useState<string | undefined>();
  const [fontFamily, setFontFamily] = React.useState(FONT_OPTIONS[0]!);
  const [radiusBase, setRadiusBase] = React.useState(10);
  const [roleTypes, setRoleTypes] = React.useState<string[]>(['liderança', 'associado']);
  const [customRoleType, setCustomRoleType] = React.useState('');
  const [enabledTypes, setEnabledTypes] = React.useState<EvaluationType[]>([
    'dialogica',
    'tradicional',
    'atividades',
  ]);

  const previewRef = React.useRef<HTMLDivElement>(null);

  const checks: ContrastCheck[] = React.useMemo(() => validatePalette(palette), [palette]);
  const paletteOk = checks.every((c) => c.passes);
  const canPublish = name.trim().length > 0 && slug.trim().length > 0 && paletteOk && roleTypes.length > 0 && enabledTypes.length > 0;

  React.useEffect(() => {
    if (!previewRef.current) return;
    applyDesignTokens(previewRef.current, {
      ...palette,
      fontFamily,
      radiusBase: `${radiusBase}px`,
    });
  }, [palette, fontFamily, radiusBase]);

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

const MAX_LOGO_BYTES = 500 * 1024; // logos are stored as base64 data URLs directly
// inside localStorage (packages/local-store), which has a small (typically
// 5-10MB, shared across every key) per-origin quota — an unbounded upload
// here could blow that quota and silently break every other write, not just
// this one. 500KB is generous for a logo and leaves headroom for everything
// else the app stores.

function handleLogoFileInto(
  file: File | undefined,
  setLogoUrl: (url: string | undefined) => void,
  setLogoError: (message: string | undefined) => void
) {
  setLogoError(undefined);
  if (!file) {
    setLogoUrl(undefined);
    return;
  }
  if (file.size > MAX_LOGO_BYTES) {
    setLogoError(`Arquivo muito grande (${Math.round(file.size / 1024)}KB) — o limite é ${MAX_LOGO_BYTES / 1024}KB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setLogoUrl(reader.result as string);
  reader.onerror = () => setLogoError('Não foi possível ler este arquivo.');
  reader.readAsDataURL(file);
}

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) return;
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      palette,
      logoUrl,
      fontFamily,
      radiusBase: `${radiusBase}px`,
      roleTypes,
      enabledEvaluationTypes: enabledTypes,
    });
  }

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480, flex: 1 }}>
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
          <label style={fieldLabelStyle}>
            Logo (claro)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoFileInto(e.target.files?.[0], setLogoUrl, setLogoError)}
            />
            {logoError && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>{logoError}</span>}
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
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 8 }}>3-4. Tipografia e forma</h2>
          <label style={fieldLabelStyle}>
            Fonte principal
            <select style={inputStyle} value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label style={fieldLabelStyle}>
            Raio de borda: {radiusBase}px
            <input
              type="range"
              min={0}
              max={24}
              value={radiusBase}
              onChange={(e) => setRadiusBase(Number(e.target.value))}
            />
          </label>
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

      <div
        ref={previewRef}
        style={{
          position: 'sticky',
          top: 0,
          width: 280,
          padding: 20,
          borderRadius: 'var(--radius-base)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Prévia ao vivo
        </p>
        {logoUrl && <img src={logoUrl} alt="Logo" style={{ maxHeight: 40, marginBottom: 12 }} />}
        <h3 style={{ color: 'var(--color-text-primary)', margin: '0 0 8px' }}>{name || 'Nome do cliente'}</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Badge tone="primary">liderança</Badge>
          <Badge tone="neutral">associado</Badge>
        </div>
        <Button variant="primary" type="button">
          Nova avaliação
        </Button>
      </div>
    </div>
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
