'use client';

import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { apiPost } from '@/lib/client';
import { cn } from '@/lib/utils';
import { MAX_COMMENT_LENGTH } from '@gamingclips/shared';

export function CommentForm({
  postId,
  parentId,
  onCancel,
  onCreated,
}: {
  postId: string;
  parentId?: string | null;
  onCancel?: () => void;
  onCreated?: () => void;
}) {
  const { status } = useSession();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const charsLeft = MAX_COMMENT_LENGTH - body.length;
  const overLimit = charsLeft < 0;

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || overLimit) return;

      setLoading(true);
      setError(null);
      try {
        await apiPost('/api/comments', {
          postId,
          body: trimmed,
          parentId: parentId ?? null,
        });
        setBody('');
        onCreated?.();
        if (parentId) onCancel?.();
        addToast('success', 'Comment posted');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to post comment';
        setError(msg);
        addToast('error', msg);
      } finally {
        setLoading(false);
      }
    },
    [body, postId, parentId, overLimit, onCreated, onCancel, addToast],
  );

  if (status !== 'authenticated') {
    return (
      <div className="card p-4 text-center text-sm text-text-muted">
        Sign in to comment
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
        className="min-h-[80px]"
        aria-label={parentId ? 'Reply' : 'Comment'}
      />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs tabular-nums',
            overLimit ? 'text-red-400' : 'text-text-muted',
          )}
        >
          {charsLeft.toLocaleString()} characters remaining
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!body.trim() || overLimit}
          >
            {parentId ? 'Reply' : 'Comment'}
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
