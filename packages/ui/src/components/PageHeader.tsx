import * as React from 'react';
import { cn } from '../lib/cn';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Usually a single primary Button. */
  actions?: React.ReactNode;
}

/** Every page starts with title (+ optional description) and an optional
 * right-aligned primary action. Consistent bottom margin (--space-6) so
 * pages never hand-roll their own header spacing. */
export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 mb-[var(--space-6)]', className)}
      {...props}
    >
      <div className="flex flex-col gap-[var(--space-1)]">
        <h1
          className="text-[length:var(--font-size-2xl)] font-[var(--font-weight-semibold)] leading-[var(--line-height-tight)] tracking-[var(--letter-spacing-tight)] text-[var(--color-text-primary)] m-0"
        >
          {title}
        </h1>
        {description && (
          <p className="text-[length:var(--font-size-md)] leading-[var(--line-height-base)] text-[var(--color-text-muted)] m-0 max-w-[60ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-[var(--space-2)] shrink-0">{actions}</div>}
    </div>
  );
}
