'use client';

import { memo } from 'react';
import Link from 'next/link';
import { cn, platformLabel } from '@/lib/utils';
import type { Platform } from '@gamingclips/shared';

const PLATFORM_COLORS: Record<Platform, string> = {
  STEAM: '#1b2838',
  PC: '#6366f1',
  PS5: '#003791',
  PS4: '#003791',
  XBOX: '#107c10',
  SWITCH: '#e60012',
  OTHER: '#6b7280',
};

export const GameChip = memo(function GameChip({
  game,
  removable = false,
  onRemove,
  onClick,
}: {
  game: { id: string; name: string; platform: Platform };
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : Link;
  const tagProps = onClick
    ? { onClick, type: 'button' as const }
    : { href: `/games/${game.id}` };

  return (
    <Tag
      {...tagProps}
      className={cn(
        'chip bg-accent-soft text-accent transition-colors hover:bg-accent/25',
        onClick && 'cursor-pointer',
      )}
    >
      <span
        className="inline-block h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: PLATFORM_COLORS[game.platform] ?? '#6b7280' }}
        title={platformLabel(game.platform)}
      />
      <span className="truncate max-w-[120px]">{game.name}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove?.();
          }}
          className="ml-0.5 shrink-0 rounded-full p-0.5 text-accent/60 hover:bg-accent/20 hover:text-accent transition-colors"
          aria-label={`Remove ${game.name}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </Tag>
  );
});
