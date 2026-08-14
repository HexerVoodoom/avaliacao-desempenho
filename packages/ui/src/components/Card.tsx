import * as React from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Set false to remove the default internal padding (e.g. when the card
   * hosts its own list rows with hairline dividers). */
  padded?: boolean;
  /** Render as a different element (e.g. "form") while keeping Card's
   * visual treatment — used by forms that want the bordered/radius look. */
  as?: React.ElementType;
}

/** Bordered container — hairline border, radius-lg, surface background. No
 * drop-shadow: elevation is reserved for true overlays (ConfirmDialog). */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padded = true, as: Comp = 'div', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]',
        padded && 'p-[var(--space-4)]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';
