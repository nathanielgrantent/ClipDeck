'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { GameChip } from '@/components/game/game-chip';
import { VoteControls } from '@/components/post/vote-controls';
import { cn, timeAgo } from '@/lib/utils';
import type { Post } from '@gamingclips/shared';

export const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const primaryMedia = post.media[0];
  const isVideo = post.type === 'CLIP';

  return (
    <article className="card group hover:border-white/20 transition-colors contain-content">
      <div className="flex gap-3 p-3">
        {/* Vote column (desktop) */}
        <div className="hidden sm:flex flex-col items-center">
          <VoteControls
            postId={post.id}
            initialScore={post.score}
            initialUserVote={post.vote ?? 0}
            compact={false}
          />
        </div>

        {/* Thumbnail */}
        <Link
          href={`/p/${post.id}`}
          className="shrink-0 relative w-[120px] h-[80px] sm:w-[160px] sm:h-[100px] rounded-btn overflow-hidden bg-surface group-hover:ring-2 ring-accent/40 transition-all"
        >
          {primaryMedia?.thumbnailUrl ? (
            <img
              src={primaryMedia.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-sidebar-hover">
              {isVideo ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-text-muted">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
          )}
          {isVideo && primaryMedia && (
            <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white/90">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {primaryMedia.durationSeconds != null && (
                <span>{Math.floor(primaryMedia.durationSeconds / 60)}:{(primaryMedia.durationSeconds % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
          {!isVideo && (
            <div className="absolute bottom-1 right-1 rounded bg-black/70 p-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/90">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Link
              href={`/c/${post.community.slug}`}
              className="font-semibold text-text-secondary hover:text-accent transition-colors"
            >
              c/{post.community.name}
            </Link>
            <span className="text-text-muted/50">&middot;</span>
            <span>Posted by</span>
            <Link href={`/u/${post.author.username}`} className="hover:text-accent transition-colors">
              u/{post.author.username}
            </Link>
          </div>

          <Link href={`/p/${post.id}`} className="block">
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          {post.body && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2 leading-relaxed">
              {post.body}
            </p>
          )}

          {post.games.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.games.slice(0, 3).map((game) => (
                <GameChip key={game.id} game={game} />
              ))}
              {post.games.length > 3 && (
                <span className="chip bg-surface text-text-muted text-xs">
                  +{post.games.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer row */}
          <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-text-muted">
            {/* Mobile vote */}
            <div className="sm:hidden">
              <VoteControls
                postId={post.id}
                initialScore={post.score}
                initialUserVote={post.vote ?? 0}
                compact={true}
              />
            </div>

            <Link
              href={`/p/${post.id}`}
              className="flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span>{post.commentCount}</span>
            </Link>

            <span className="ml-auto text-text-muted/60">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
});
