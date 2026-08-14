import * as React from 'react';
import { cn } from '../lib/cn';

/** Shared control styling — matches Button's height/radius/border/focus-ring
 * conventions so form controls and buttons sit at the same visual weight. */
export const controlClassName = [
  'w-full h-10 px-[var(--space-3)]',
  'rounded-[var(--radius-sm)] border border-[var(--color-border)]',
  'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
  'text-[length:var(--font-size-sm)] font-[var(--font-weight-regular)]',
  'placeholder:text-[var(--color-text-muted)]',
  'transition-colors',
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] focus-visible:border-[var(--color-primary)]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlClassName, className)} {...props} />
  )
);
Input.displayName = 'Input';
