import * as React from 'react';
import { cn } from '../lib/cn';

export interface FieldProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label: React.ReactNode;
  hint?: React.ReactNode;
  /** Right-aligned addon next to the label, e.g. a small Badge showing a live value. */
  labelAddon?: React.ReactNode;
}

/** Label + control wrapper for forms — consistent gap/typography so every
 * page's forms read the same. Wrap a single Input/Select/Textarea child. */
export const Field = React.forwardRef<HTMLLabelElement, FieldProps>(
  ({ label, hint, labelAddon, className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('flex flex-col gap-[var(--space-1)] flex-1', className)}
      {...props}
    >
      <span className="flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)]">
        {label}
        {labelAddon}
      </span>
      {children}
      {hint && (
        <span className="text-[length:var(--font-size-xs)] text-[var(--color-text-muted)]">{hint}</span>
      )}
    </label>
  )
);
Field.displayName = 'Field';
