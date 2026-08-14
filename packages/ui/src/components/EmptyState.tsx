import * as React from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Usually a primary Button ("Criar o primeiro..."). */
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

/** "Nothing here yet" — replaces a bare gray line of text. Centered, muted,
 * with an optional action to resolve the emptiness right there. */
export function EmptyState({ title, description, action, icon, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]',
        'py-[var(--space-12)] px-[var(--space-6)] gap-[var(--space-2)]',
        className
      )}
      {...props}
    >
      {icon && <div className="text-[var(--color-text-muted)] mb-[var(--space-1)]">{icon}</div>}
      <p className="text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] m-0">
        {title}
      </p>
      {description && (
        <p className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)] m-0 max-w-[48ch]">
          {description}
        </p>
      )}
      {action && <div className="mt-[var(--space-2)]">{action}</div>}
    </div>
  );
}
