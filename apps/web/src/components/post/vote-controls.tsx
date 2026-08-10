'use client';

import { memo, useCallback, useState } from 'react';
import { apiPost } from '@/lib/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export const VoteControls = memo(function VoteControls({
  postId,
  commentId,
  initialScore,
  initialUserVote = 0,
  compact = false,
  onScoreChange,
}: {
  postId?: string;
  commentId?: string;
  initialScore: number;
  initialUserVote?: 1 | -1 | 0;
  compact?: boolean;
  onScoreChange?: (score: number, vote: 1 | -1 | 0) => void;
}) {
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [score, setScore] = useState(initialScore);
  const [pending, setPending] = useState(false);
  const { addToast } = useToast();

  const vote = useCallback(
    async (value: 1 | -1) => {
      if (pending) return;
      const newVote = userVote === value ? 0 : value;
      const delta = newVote - userVote;
      const newScore = score + delta;

      setPending(true);
      setUserVote(newVote);
      setScore(newScore);
      onScoreChange?.(newScore, newVote);

      try {
        const endpoint = postId
          ? `/api/posts/${postId}/vote`
          : `/api/comments/${commentId}/vote`;
        await apiPost<{ score: number; vote: 1 | -1 | 0 }>(endpoint, { value: newVote });
      } catch {
        setUserVote(userVote);
        setScore(score);
        onScoreChange?.(score, userVote);
        addToast('error', 'Failed to vote');
      } finally {
        setPending(false);
      }
    },
    [postId, commentId, userVote, score, pending, onScoreChange, addToast],
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1" role="group" aria-label="Vote">
        <button
          onClick={() => vote(1)}
          disabled={pending}
          className={cn(
            'p-0.5 rounded transition-colors',
            userVote === 1
              ? 'text-upvote'
              : 'text-text-muted hover:text-upvote hover:bg-upvote/10',
          )}
          aria-label="Upvote"
          aria-pressed={userVote === 1}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
        </button>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums min-w-[2ch] text-center',
            userVote === 1 && 'text-upvote',
            userVote === -1 && 'text-downvote',
            userVote === 0 && 'text-text-muted',
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {score}
        </span>
        <button
          onClick={() => vote(-1)}
          disabled={pending}
          className={cn(
            'p-0.5 rounded transition-colors',
            userVote === -1
              ? 'text-downvote'
              : 'text-text-muted hover:text-downvote hover:bg-downvote/10',
          )}
          aria-label="Downvote"
          aria-pressed={userVote === -1}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-card bg-surface-raised" role="group" aria-label="Vote">
      <button
        onClick={() => vote(1)}
        disabled={pending}
        className={cn(
          'flex items-center justify-center h-9 w-9 rounded-l-card transition-colors',
          userVote === 1
            ? 'text-upvote bg-upvote/10'
            : 'text-text-muted hover:text-upvote hover:bg-upvote/5',
        )}
        aria-label="Upvote"
        aria-pressed={userVote === 1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z" />
        </svg>
      </button>
      <span
        className={cn(
          'text-sm font-bold tabular-nums min-w-[3ch] text-center select-none transition-colors',
          userVote === 1 && 'text-upvote',
          userVote === -1 && 'text-downvote',
          userVote === 0 && 'text-text-secondary',
        )}
      >
        {score}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={pending}
        className={cn(
          'flex items-center justify-center h-9 w-9 rounded-r-card transition-colors',
          userVote === -1
            ? 'text-downvote bg-downvote/10'
            : 'text-text-muted hover:text-downvote hover:bg-downvote/5',
        )}
        aria-label="Downvote"
        aria-pressed={userVote === -1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l8-8h-5V4H9v8H4z" />
        </svg>
      </button>
    </div>
  );
});
