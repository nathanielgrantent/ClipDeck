'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentForm } from '@/components/post/comment-form';
import { VoteControls } from '@/components/post/vote-controls';
import { cn, timeAgo } from '@/lib/utils';
import type { Comment } from '@gamingclips/shared';

type SortMode = 'hot' | 'new' | 'top';

interface CommentWithVote extends Comment {
  vote?: 1 | -1 | 0;
}

function sortComments(comments: Comment[], mode: SortMode): Comment[] {
  const sorted = [...comments];
  switch (mode) {
    case 'new':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'top':
      return sorted.sort((a, b) => b.score - a.score);
    case 'hot':
    default:
      return sorted.sort((a, b) => {
        const ageA = (Date.now() - new Date(a.createdAt).getTime()) / 3600000;
        const ageB = (Date.now() - new Date(b.createdAt).getTime()) / 3600000;
        const hotA = a.score / Math.pow(ageA + 2, 1.5);
        const hotB = b.score / Math.pow(ageB + 2, 1.5);
        return hotB - hotA;
      });
  }
}

const CommentNode = memo(function CommentNode({
  comment,
  postId,
  depth = 0,
}: {
  comment: CommentWithVote;
  postId: string;
  depth?: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const childCount = comment.children?.length ?? 0;

  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-6 border-l-2 border-white/5 pl-3')}>
      <div className="py-2">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Avatar src={comment.author.avatarUrl} name={comment.author.username} size={20} />
          <Link
            href={`/u/${comment.author.username}`}
            className="text-xs font-semibold text-text-primary hover:text-accent transition-colors"
          >
            {comment.author.username}
          </Link>
          <span className="text-xs text-text-muted/60">&middot;</span>
          <span className="text-xs text-text-muted">{timeAgo(comment.createdAt)}</span>
          {childCount > 0 && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors ml-1"
              aria-label={collapsed ? 'Expand thread' : 'Collapse thread'}
            >
              [{collapsed ? `+${childCount}` : '−'}]
            </button>
          )}
        </div>

        {/* Body */}
        {!collapsed && (
          <>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words ml-7">
              {comment.body}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1.5 ml-7">
              <VoteControls
                commentId={comment.id}
                initialScore={comment.score}
                initialUserVote={comment.vote ?? 0}
                compact={true}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyOpen((o) => !o)}
                className="h-6 px-2 text-xs"
              >
                Reply
              </Button>
            </div>

            {/* Reply form */}
            {replyOpen && (
              <div className="mt-2 ml-7">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  onCancel={() => setReplyOpen(false)}
                  onCreated={() => setReplyOpen(false)}
                />
              </div>
            )}

            {/* Children */}
            {comment.children && comment.children.length > 0 && (
              <div className="mt-1">
                {sortComments(comment.children, 'hot').map((child) => (
                  <CommentNode
                    key={child.id}
                    comment={child}
                    postId={postId}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export function CommentThread({
  postId,
  comments,
}: {
  postId: string;
  comments: CommentWithVote[];
}) {
  const [sort, setSort] = useState<SortMode>('hot');

  const sorted = useMemo(() => sortComments(comments, sort), [comments, sort]);

  const handleSort = useCallback((s: SortMode) => setSort(s), []);

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-1 mb-4">
        <span className="text-xs text-text-muted mr-1">Sort:</span>
        {(['hot', 'new', 'top'] as const).map((s) => (
          <button
            key={s}
            onClick={() => handleSort(s)}
            className={cn(
              'px-2.5 py-1 rounded-btn text-xs font-medium transition-colors',
              sort === s
                ? 'bg-accent text-white'
                : 'text-text-muted hover:bg-sidebar-hover hover:text-text-primary',
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Comment list */}
      {sorted.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-muted">
          No comments yet. Be the first!
        </div>
      ) : (
        sorted.map((comment) => (
          <CommentNode key={comment.id} comment={comment} postId={postId} />
        ))
      )}
    </div>
  );
}
