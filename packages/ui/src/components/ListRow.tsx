import * as React from 'react';
import { cn } from '../lib/cn';

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'title'> {
  /** Primary text (name, title). */
  title: React.ReactNode;
  /** Secondary metadata line under the title. */
  meta?: React.ReactNode;
  /** Right-aligned badges/buttons. */
  actions?: React.ReactNode;
}

/** One row inside a Card-wrapped <ul>. Hairline divider between rows (each
 * row draws its own top border except the first), consistent padding/hover,
 * clear primary-vs-metadata hierarchy. Used by Members/Roles/Evaluations/
 * History lists so they share one visual pattern without being literal
 * <table>s. */
export const ListRow = React.forwardRef<HTMLLIElement, ListRowProps>(
  ({ title, meta, actions, className, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn(
        'flex items-center justify-between gap-[var(--space-4)]',
        'px-[var(--space-4)] py-[var(--space-3)]',
        'border-t border-[var(--color-border)] first:border-t-0',
        'hover:bg-[var(--color-surface-muted)] transition-colors',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-[var(--space-1)] min-w-0">
        <span className="text-[length:var(--font-size-base)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] truncate">
          {title}
        </span>
        {meta && (
          <span className="text-[length:var(--font-size-sm)] text-[var(--color-text-muted)] truncate">{meta}</span>
        )}
        {children}
      </div>
      {actions && <div className="flex items-center gap-[var(--space-2)] shrink-0">{actions}</div>}
    </li>
  )
);
ListRow.displayName = 'ListRow';

export function ListRowGroup({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('list-none p-0 m-0', className)} {...props} />;
}
