'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label?: string;
  'aria-describedby'?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id: propId, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;

    return (
      <label className="block w-full" htmlFor={id}>
        {label && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : ariaDescribedBy}
          className={cn('input', error && 'ring-2 ring-red-500/60', className)}
          {...props}
        />
        {error && (
          <span id={errorId} className="mt-1 block text-xs text-red-400" role="alert">
            {error}
          </span>
        )}
      </label>
    );
  },
);
Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  label?: string;
  'aria-describedby'?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id: propId, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;

    return (
      <label className="block w-full" htmlFor={id}>
        {label && (
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </span>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : ariaDescribedBy}
          className={cn('input min-h-[96px] resize-y', error && 'ring-2 ring-red-500/60', className)}
          {...props}
        />
        {error && (
          <span id={errorId} className="mt-1 block text-xs text-red-400" role="alert">
            {error}
          </span>
        )}
      </label>
    );
  },
);
Textarea.displayName = 'Textarea';
