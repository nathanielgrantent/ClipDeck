'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePost } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn, timeAgo, platformLabel } from '@/lib/utils';
import { apiPost } from '@/lib/client';
import { VoteButtons } from '@/components/posts/vote-buttons';
import { formatBytes } from '@gamingclips/shared';
import Link from 'next/link';
import type { Comment } from '@gamingclips/shared';

const VideoPlayer = dynamic(
  () => import('@/components/posts/video-player').then((m) => m.VideoPlayer),
  {
    loading: () => (
      <div className="relative w-full bg-black rounded-card overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      </div>
    ),
    ssr: false,
  },
);

function CommentItem({
  comment,
  postId,
  depth = 0,
  onCommentAdded,
}: {
  comment: Comment;
  postId: string;
  depth?: number;
  onCommentAdded: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { status } = useSession();

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/api/comments', {
        postId,
        body: replyBody.trim(),
        parentId: comment.id,
      });
      setReplyBody('');
      setReplying(false);
      onCommentAdded();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('py-3', depth > 0 && 'ml-4 border-l-2 border-sidebar-hover pl-4')}>
      <div className="flex items-start gap-3">
        <Avatar src={comment.author.avatarUrl} name={comment.author.username} size={24} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary">{comment.author.username}</span>
            <span className="text-[10px] text-text-muted">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap break-words">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <VoteButtons
              postId={comment.id}
              score={comment.score}
              vote={0}
              comment
              compact
            />
            {status === 'authenticated' && (
              <button
                onClick={() => setReplying(!replying)}
                className="text-[11px] text-text-muted hover:text-text-secondary"
              >
                Reply
              </button>
            )}
          </div>
          {replying && (
            <form onSubmit={submitReply} className="mt-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="input min-h-[60px] text-xs"
                placeholder="Write a reply..."
                required
              />
              <div className="mt-1 flex gap-2">
                <Button type="submit" size="sm" variant="primary" loading={submitting}>
                  Reply
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      {comment.children.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          postId={postId}
          depth={depth + 1}
          onCommentAdded={onCommentAdded}
        />
      ))}
    </div>
  );
}

function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { status } = useSession();

  const fetchComments = useCallback(async () => {
    try {
      const data = await import('@/lib/client').then((m) =>
        m.apiGet<Comment[]>(`/api/comments?postId=${postId}`),
      );
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/client').then((m) =>
      m.apiGet<Comment[]>(`/api/comments?postId=${postId}`),
    ).then((data) => {
      if (!cancelled) setComments(data);
    }).catch(() => {
      if (!cancelled) setComments([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [postId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/api/comments', {
        postId,
        body: newComment.trim(),
      });
      setNewComment('');
      fetchComments();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 border-t border-black/20 pt-4">
      <h3 className="mb-4 text-sm font-semibold text-text-primary">
        Comments ({comments.length})
      </h3>

      {status === 'authenticated' ? (
        <form onSubmit={submitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Add a comment..."
            required
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" size="sm" variant="primary" loading={submitting}>
              Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-card bg-sidebar p-4 text-center text-sm text-text-secondary">
          <Link href="/login" className="link">Sign in</Link> to leave a comment.
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-black/10">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
      <Skeleton variant="media" />
      <Skeleton lines={1} className="w-3/4 !h-6" />
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <Skeleton lines={1} className="w-24" />
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { post, isLoading, error } = usePost(id);
  const { status } = useSession();
  const router = useRouter();

  if (isLoading) {
    return (
      <AppShell>
        <PostSkeleton />
      </AppShell>
    );
  }

  if (error || !post) {
    return (
      <AppShell>
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl">🔍</div>
          <h1 className="text-xl font-semibold text-text-primary">Post not found</h1>
          <p className="text-sm text-text-secondary">
            This post does not exist or has been removed.
          </p>
          <Link href="/" className="btn-primary mt-2">
            Back to Home
          </Link>
        </div>
      </AppShell>
    );
  }

  const primaryMedia = post.media[0];

  return (
    <AppShell activeSlug={post.community.slug}>
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4">
          <Link href={`/c/${post.community.slug}`} className="text-xs text-text-muted hover:text-text-secondary">
            {post.community.name}
          </Link>
        </div>

        {primaryMedia && (
          <div className="mb-4 overflow-hidden rounded-card bg-black">
            {primaryMedia.type === 'VIDEO' && primaryMedia.hlsUrl ? (
              <VideoPlayer
                src={primaryMedia.hlsUrl}
                poster={primaryMedia.thumbnailUrl || undefined}
                controls
                className="w-full"
              />
            ) : primaryMedia.type === 'VIDEO' ? (
              <video
                src={primaryMedia.originalUrl || undefined}
                poster={primaryMedia.thumbnailUrl || undefined}
                controls
                className="w-full"
              />
            ) : (
              <img
                src={primaryMedia.originalUrl || primaryMedia.thumbnailUrl || ''}
                alt={post.title}
                className="w-full"
              />
            )}
          </div>
        )}

        <div className="flex gap-4">
          <VoteButtons
            postId={post.id}
            score={post.score}
            vote={post.vote ?? 0}
          />

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-text-primary">{post.title}</h1>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar src={post.author.avatarUrl} name={post.author.username} size={24} />
                <span className="text-sm font-medium text-text-primary">{post.author.username}</span>
              </div>
              <span className="text-xs text-text-muted">{timeAgo(post.createdAt)}</span>
            </div>

            {post.body && (
              <p className="mt-4 text-sm text-text-secondary whitespace-pre-wrap break-words">
                {post.body}
              </p>
            )}

            {post.games.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.games.map((game) => (
                  <span key={game.id} className="chip bg-sidebar-hover text-text-secondary">
                    {game.name}
                    <span className="text-text-muted ml-1">{platformLabel(game.platform)}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
              <span className="capitalize chip bg-sidebar-hover text-text-secondary">{post.type.toLowerCase()}</span>
              <span>{post.commentCount} comments</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                }}
                className="flex items-center gap-1 hover:text-text-secondary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16,6 12,2 8,6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        <CommentSection postId={post.id} />
      </div>
    </AppShell>
  );
}
