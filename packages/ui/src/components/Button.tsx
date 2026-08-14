import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Reference Button. Visual weight comes entirely from CSS custom properties
 * (--color-primary, --radius-base, ...) so a client theme never requires
 * touching this file — see packages/ui/src/tokens.css and theme.ts.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-base)] text-[length:var(--font-size-sm)] font-medium',
    'transition-colors disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:brightness-110',
        secondary:
          'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)]',
        ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]',
        danger: 'bg-[var(--color-danger)] text-white hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-[length:var(--font-size-base)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';
