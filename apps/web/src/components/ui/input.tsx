'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <label className="block w-full">
        {label && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </span>
        )}
        <input ref={ref} className={cn('input', error && 'ring-2 ring-red-500/60', className)} {...props} />
        {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
      </label>
    );
  },
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <label className="block w-full">
        {label && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </span>
        )}
        <textarea ref={ref} className={cn('input min-h-[96px] resize-y', error && 'ring-2 ring-red-500/60', className)} {...props} />
        {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
      </label>
    );
  },
);
Textarea.displayName = 'Textarea';
