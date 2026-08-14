import type { DesignTokens } from '@studio/domain';

/** Maps a DesignTokens record (loaded from Organization.designTokens in
 * Supabase) onto the CSS custom properties declared in tokens.css. This is
 * the ONLY place a client's identity touches runtime rendering — components
 * never read DesignTokens directly. */
const CSS_VAR_MAP: Record<keyof DesignTokens, string | null> = {
  colorPrimary: '--color-primary',
  colorSecondary: '--color-secondary',
  colorSuccess: '--color-success',
  colorWarning: '--color-warning',
  colorDanger: '--color-danger',
  colorSurface: '--color-surface',
  colorSurfaceMuted: '--color-surface-muted',
  colorTextPrimary: '--color-text-primary',
  colorTextMuted: '--color-text-muted',
  fontFamily: '--font-family-base',
  radiusBase: '--radius-base',
  logoUrlLight: null,
  logoUrlDark: null,
  faviconUrl: null,
  density: null,
};

export function applyDesignTokens(target: HTMLElement, tokens: Partial<DesignTokens>): void {
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP) as [keyof DesignTokens, string | null][]) {
    if (!cssVar) continue;
    const value = tokens[key];
    if (typeof value === 'string' && value.length > 0) {
      target.style.setProperty(cssVar, value);
    }
  }
  if (tokens.density) {
    target.setAttribute('data-density', tokens.density);
  }
}
