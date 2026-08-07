'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-secondary">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted">Error: {error.digest}</p>
      )}
      <button onClick={reset} className="btn-primary mt-2">
        Try Again
      </button>
    </div>
  );
}
