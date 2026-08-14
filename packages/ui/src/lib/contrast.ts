/**
 * WCAG 2.1 contrast validator — enforces docs/design.md.template §2/§8
 * ("todo par cor/fundo passa pelo validador de contraste automático antes
 * de o tema ser publicado"). Pure functions, no DOM dependency, so this runs
 * both in the browser (Studio-admin preview) and in CI.
 */

export interface ContrastCheck {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  /** WCAG AA thresholds: 4.5:1 for normal text, 3:1 for large text/UI components. */
  minRatio: number;
  passes: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface DesignTokenPalette {
  colorPrimary: string;
  colorSecondary: string;
  colorSuccess: string;
  colorWarning: string;
  colorDanger: string;
  colorSurface: string;
  colorSurfaceMuted: string;
  colorTextPrimary: string;
  colorTextMuted: string;
}

/**
 * The exact pairs docs/design.md.template §2 requires. `minRatio: 4.5` = AA
 * for normal text; `3` = AA for large text / UI components (icons, borders).
 */
export function validatePalette(tokens: DesignTokenPalette): ContrastCheck[] {
  const pairs: Array<[string, keyof DesignTokenPalette, keyof DesignTokenPalette, number]> = [
    ['Primária sobre superfície', 'colorPrimary', 'colorSurface', 4.5],
    ['Primária sobre branco', 'colorPrimary', 'colorSurface', 4.5],
    ['Secundária sobre superfície', 'colorSecondary', 'colorSurface', 4.5],
    ['Texto principal sobre superfície', 'colorTextPrimary', 'colorSurface', 4.5],
    ['Texto secundário sobre superfície', 'colorTextMuted', 'colorSurface', 3],
    ['Sucesso sobre superfície', 'colorSuccess', 'colorSurface', 3],
    ['Alerta sobre superfície', 'colorWarning', 'colorSurface', 3],
    ['Perigo sobre superfície', 'colorDanger', 'colorSurface', 3],
  ];

  return pairs.map(([label, fgKey, bgKey, minRatio]) => {
    const foreground = tokens[fgKey];
    const background = tokens[bgKey];
    const ratio = contrastRatio(foreground, background);
    return {
      label,
      foreground,
      background,
      ratio: Math.round(ratio * 100) / 100,
      minRatio,
      passes: ratio >= minRatio,
    };
  });
}

export function paletteIsPublishable(tokens: DesignTokenPalette): boolean {
  return validatePalette(tokens).every((check) => check.passes);
}
