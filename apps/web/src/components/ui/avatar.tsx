'use client';

import { memo } from 'react';
import { cn, initials } from '@/lib/utils';

export const Avatar = memo(function Avatar({
  src,
  name,
  size = 32,
  className,
  status,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  status?: 'online' | 'idle' | 'offline' | 'none';
}) {
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-accent text-white font-semibold select-none"
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials(name)}
        </div>
      )}
      {status && status !== 'none' && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full border-2 border-content-darker',
            status === 'online' && 'bg-green-500',
            status === 'idle' && 'bg-amber-400',
            status === 'offline' && 'bg-text-muted',
          )}
          style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
        />
      )}
    </div>
  );
});
