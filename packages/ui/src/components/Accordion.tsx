import * as React from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import { cn } from '../lib/cn';

export const Accordion = RadixAccordion.Root;

export function AccordionItem({ className, ...props }: RadixAccordion.AccordionItemProps) {
  return (
    <RadixAccordion.Item
      className={cn('border-b border-[var(--color-border)]', className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: RadixAccordion.AccordionTriggerProps) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          'flex flex-1 items-center justify-between py-3 text-left text-[length:var(--font-size-base)] font-medium',
          'text-[var(--color-text-primary)] transition-transform [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 transition-transform duration-200"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: RadixAccordion.AccordionContentProps) {
  return (
    <RadixAccordion.Content
      className={cn('overflow-hidden pb-3 text-[length:var(--font-size-sm)]', className)}
      {...props}
    >
      {children}
    </RadixAccordion.Content>
  );
}
