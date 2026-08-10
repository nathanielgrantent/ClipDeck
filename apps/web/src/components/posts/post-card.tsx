'use client';

import { memo, lazy, Suspense } from 'react';
import Link from 'next/link';
import type { Post } from '@gamingclips/shared';
import { formatBytes, formatTime } from '@/lib/format';
import { cn, timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { VoteButtons } from '@/components/posts/vote-buttons';

const VideoPlayer = lazy(() =>
  import('@/components/posts/video-player').then((m) => ({ default: m.VideoPlayer }))
);

export const PostCard = memo(function PostCard({ post, muted = true }: { post: Post; muted?: boolean }) {
  return (
    <article className="group break-inside-avoid overflow-hidden rounded-btn border border-white/5 bg-card shadow-sm transition-shadow hover:border-white/10 hover:shadow-lg contain-content">
      <Link href={`/p/${post.id}`} className="block">
        <MediaView post={post} muted={muted} />
      </Link>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-text-muted">
              <Link href={`/c/${post.community.slug}`} className="font-semibold text-text-link hover:underline">
                c/{post.community.slug}
              </Link>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
            <Link href={`/p/${post.id}`} className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary hover:text-text-link">
              {post.title}
            </Link>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <VoteButtons postId={post.id} score={post.score} vote={post.vote ?? 0} compact />
            <span className="ml-1 flex items-center gap-1 text-xs text-text-muted" title={`${post.commentCount} comments`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
              {post.commentCount}
            </span>
          </div>
          <Link href={`/p/${post.id}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary">
            <Avatar src={post.author.avatarUrl} name={post.author.username} size={18} />
            <span className="truncate">{post.author.username}</span>
          </Link>
        </div>

        {post.games.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.games.slice(0, 3).map((g) => (
              <span key={g.id} className="badge">
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
});

function VideoPlaceholder() {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-black/60">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}

function MediaView({ post, muted }: { post: Post; muted: boolean }) {
  const media = post.media[0];
  if (!media) return <div className="flex aspect-video items-center justify-center bg-black/40 text-xs text-text-muted">No media</div>;

  const isVideo = media.type === 'VIDEO';

  if (isVideo) {
    if (media.status === 'READY' && media.hlsUrl) {
      return (
        <div className="relative w-full overflow-hidden bg-black/60">
          <Suspense fallback={<VideoPlaceholder />}>
            <VideoPlayer
              src={media.hlsUrl}
              poster={media.thumbnailUrl}
              muted={muted}
              loop={muted}
              autoPlay={muted}
              className="w-full"
            />
          </Suspense>
          {media.durationSeconds != null && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {formatTime(media.durationSeconds)}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
        {media.thumbnailUrl ? (
          <img src={media.thumbnailUrl} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center" />
        )}
        <ProcessingBadge failed={media.status === 'FAILED'} />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-black/40">
      <img
        src={media.originalUrl ?? media.thumbnailUrl ?? ''}
        alt={post.title}
        className="w-full"
        loading="lazy"
        decoding="async"
      />
      <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {formatBytes(media.sizeBytes)}
      </span>
    </div>
  );
}

function ProcessingBadge({ failed }: { failed: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={cn('flex items-center gap-2 rounded bg-black/70 px-3 py-1.5 text-xs font-medium text-white')}>
        {failed ? (
          <span className="text-red-400">Processing failed</span>
        ) : (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Processing…</span>
          </>
        )}
      </div>
    </div>
  );
}
