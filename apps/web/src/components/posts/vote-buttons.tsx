'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/client';
import { useSession } from 'next-auth/react';

export function VoteButtons({
  postId,
  score: initialScore,
  vote: initialVote,
  comment = false,
  compact = false,
  onMutate,
}: {
  postId: string;
  score: number;
  vote: 1 | -1 | 0;
  comment?: boolean;
  compact?: boolean;
  onMutate?: (updater: (value: unknown) => unknown) => void;
}) {
  const { status } = useSession();
  const [vote, setVote] = useState(initialVote);
  const [score, setScore] = useState(initialScore);
  const [busy, setBusy] = useState(false);

  async function cast(next: 1 | -1 | 0) {
    if (status !== 'authenticated') {
      window.location.href = '/login';
      return;
    }
    if (busy) return;
    setBusy(true);
    const prev = vote;
    const optimistic = next === prev ? 0 : next;
    setVote(optimistic);
    setScore((s) => s + (optimistic - prev));
    try {
      await apiPost<{ score: number; vote: number }>(
        comment ? `/api/comments/${postId}/vote` : `/api/posts/${postId}/vote`,
        { value: next },
      );
      onMutate?.((x) => x);
    } catch {
      setVote(prev);
      setScore((s) => s - (optimistic - prev));
    } finally {
      setBusy(false);
    }
  }

  const Arrow = (
    <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5l7 9H5l7-9z" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <button
        onClick={() => cast(1)}
        aria-label="Upvote"
        className={cn(
          'rounded transition-colors',
          compact ? 'p-0.5' : 'p-1',
          vote === 1 ? 'text-upvote' : 'text-text-muted hover:text-upvote',
        )}
      >
        {Arrow}
      </button>
      <span
        className={cn(
          'font-semibold tabular-nums',
          compact ? 'text-[11px]' : 'text-xs',
          vote === 1 ? 'text-upvote' : vote === -1 ? 'text-downvote' : 'text-text-secondary',
        )}
      >
        {score}
      </span>
      <button
        onClick={() => cast(-1)}
        aria-label="Downvote"
        className={cn(
          'rounded transition-colors',
          compact ? 'p-0.5' : 'p-1',
          vote === -1 ? 'text-downvote' : 'text-text-muted hover:text-downvote',
        )}
      >
        <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 19l-7-9h14l-7 9z" />
        </svg>
      </button>
    </div>
  );
}
