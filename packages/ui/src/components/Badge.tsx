import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/** Used for role-type tags ("liderança" / "associado" / ...), score labels, status pills. */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[length:var(--font-size-xs)] font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
        danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
