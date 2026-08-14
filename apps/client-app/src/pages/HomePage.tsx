import * as React from 'react';
import type { Organization } from '@studio/domain';

/**
 * Card-based home screen, driven entirely by Organization.designTokens —
 * no per-tenant branching in this component. Ported from the layout of the
 * original NOSSA single-tenant prototype (full-bleed hero + glass cards +
 * gradient footer), adapted to this repo's token-driven theming: any org
 * without backgroundImageUrl/footerLogoUrl set just gets the plain
 * surface-colored fallback below instead of the hero treatment.
 */

type HomeTab = 'newEvaluation' | 'savedEvaluations' | 'members' | 'roles' | 'competencies';

interface HomePageProps {
  organization: Organization;
  onNavigate: (tab: HomeTab) => void;
}

function IconBuilding() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="28" height="28">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1M9 22v-4h6v4" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22">
      <rect x="6" y="4" width="12" height="17" rx="1.5" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M9 11h6M9 15h6" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22">
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17 8a3 3 0 1 1 0-6M22 20c0-2.6-2-4.8-4.8-5.6" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 12h20" />
    </svg>
  );
}
function IconCap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="22" height="22">
      <path d="M2 9l10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
    </svg>
  );
}

function GlassCard({
  onClick,
  icon,
  title,
  subtitle,
  large,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  large?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'group flex items-center gap-4 rounded-2xl border-2 border-white bg-white/90 text-left backdrop-blur ' +
        'shadow-sm transition-shadow hover:shadow-lg ' +
        (large ? 'p-6' : 'p-5')
      }
    >
      <span
        className={
          'flex shrink-0 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm ' +
          (large ? 'h-16 w-16' : 'h-12 w-12')
        }
      >
        {icon}
      </span>
      <span className="flex flex-col">
        <span className={'font-semibold text-slate-900 ' + (large ? 'text-lg' : 'text-base')}>{title}</span>
        <span className="text-sm text-slate-500">{subtitle}</span>
      </span>
    </button>
  );
}

export function HomePage({ organization, onNavigate }: HomePageProps) {
  const tokens = organization.designTokens;
  const hasHero = Boolean(tokens.backgroundImageUrl);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
        {tokens.logoUrlLight ? (
          <img src={tokens.logoUrlLight} alt={organization.name} className="h-10 w-auto" />
        ) : null}
        <h1 className="text-lg font-semibold text-slate-900">Arquitetura de Carreira</h1>
      </header>

      <main
        className="relative flex-1"
        style={
          hasHero
            ? {
                backgroundImage: `url(${tokens.backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { backgroundColor: 'var(--color-surface-muted)' }
        }
      >
        {hasHero ? <div className="absolute inset-0 bg-white/10" /> : null}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
          <GlassCard
            large
            onClick={() => onNavigate('newEvaluation')}
            icon={<IconBuilding />}
            title="Nova Avaliação"
            subtitle="Inicie uma avaliação de desempenho para um membro da equipe"
          />
          <GlassCard
            onClick={() => onNavigate('savedEvaluations')}
            icon={<IconClipboard />}
            title="Avaliações Salvas"
            subtitle="Consulte avaliações em andamento ou concluídas"
          />

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <GlassCard onClick={() => onNavigate('members')} icon={<IconUsers />} title="Membros" subtitle="Equipe cadastrada" />
            <GlassCard onClick={() => onNavigate('roles')} icon={<IconBriefcase />} title="Cargos" subtitle="Cargos e atividades" />
            <GlassCard
              onClick={() => onNavigate('competencies')}
              icon={<IconCap />}
              title="Competências"
              subtitle="Biblioteca de competências"
            />
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 bg-gradient-to-r from-slate-200 to-slate-300 px-6 py-4">
        {tokens.footerLogoUrl ? (
          <img src={tokens.footerLogoUrl} alt="" className="h-8 w-auto opacity-75" />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 text-right">
          <span className="text-xs leading-tight text-slate-600">
            {tokens.footerText ? <span className="block font-medium">{tokens.footerText}</span> : null}
            {tokens.footerSubtext ? <span className="block">{tokens.footerSubtext}</span> : null}
          </span>
          {tokens.footerIconUrl ? <img src={tokens.footerIconUrl} alt="" className="h-6 w-6" /> : null}
        </div>
      </footer>
    </div>
  );
}
