import { memo } from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'text' | 'card' | 'avatar' | 'media';

export const Skeleton = memo(function Skeleton({
  variant = 'text',
  className,
  lines = 1,
}: {
  variant?: SkeletonVariant;
  className?: string;
  lines?: number;
}) {
  if (variant === 'avatar') {
    return (
      <div
        className={cn('shrink-0 rounded-full bg-sidebar-hover animate-pulse', className)}
        aria-hidden
      />
    );
  }

  if (variant === 'media') {
    return (
      <div
        className={cn('w-full rounded-card bg-sidebar-hover animate-pulse', className)}
        style={{ aspectRatio: '16/9' }}
        aria-hidden
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-card bg-surface border border-black/20 p-4', className)} aria-hidden>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-hover animate-pulse" />
          <div className="h-3 w-24 rounded bg-sidebar-hover animate-pulse" />
          <div className="h-3 w-16 rounded bg-sidebar-hover animate-pulse ml-auto" />
        </div>
        <div className="h-4 w-3/4 rounded bg-sidebar-hover animate-pulse mb-2" />
        <div className="h-3 w-full rounded bg-sidebar-hover animate-pulse mb-1.5" />
        <div className="h-3 w-2/3 rounded bg-sidebar-hover animate-pulse mb-4" />
        <div className="h-28 w-full rounded bg-sidebar-hover animate-pulse" />
        <div className="flex gap-2 mt-3">
          <div className="h-5 w-12 rounded-full bg-sidebar-hover animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-sidebar-hover animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-3 rounded bg-sidebar-hover animate-pulse',
            i === lines - 1 ? 'w-2/3' : 'w-full',
          )}
        />
      ))}
    </div>
  );
});
