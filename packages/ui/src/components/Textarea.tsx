import * as React from 'react';
import { cn } from '../lib/cn';
import { controlClassName } from './Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(controlClassName, 'h-auto min-h-[80px] py-[var(--space-2)] resize-y font-[inherit]', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
