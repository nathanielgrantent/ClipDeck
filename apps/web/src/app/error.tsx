'use client';

import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[GlobalError]', error);
  }

  return (
    <ErrorBoundary fallbackTitle="Something went wrong" fallbackDescription="An unexpected error occurred. Please try again.">
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
        <p className="max-w-md text-sm text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-text-muted">Error: {error.digest}</p>
        )}
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-2 max-w-lg overflow-auto rounded-card bg-content-input p-3 text-left text-xs text-red-400">
            {error.message}
          </pre>
        )}
        <button onClick={reset} className="btn-primary mt-2">
          Try Again
        </button>
      </div>
    </ErrorBoundary>
  );
}
