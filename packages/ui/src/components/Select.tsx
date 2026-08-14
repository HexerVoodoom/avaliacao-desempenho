import * as React from 'react';
import { cn } from '../lib/cn';
import { controlClassName } from './Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlClassName, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';
