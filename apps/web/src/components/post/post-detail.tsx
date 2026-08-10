'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { GameChip } from '@/components/game/game-chip';
import { VoteControls } from '@/components/post/vote-controls';
import { cn, timeAgo } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { apiPost } from '@/lib/client';
import type { Post } from '@gamingclips/shared';

const MediaPlayer = dynamic(() => import('@/components/post/media-player').then((m) => m.MediaPlayer), {
  loading: () => (
    <div className="relative w-full bg-surface rounded-card overflow-hidden" style={{ aspectRatio: '16/9' }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    </div>
  ),
  ssr: false,
});

export function PostDetail({ post }: { post: Post }) {
  const [reported, setReported] = useState(false);
  const { addToast } = useToast();

  const primaryMedia = post.media[0];

  const handleReport = async () => {
    if (reported) return;
    try {
      await apiPost('/api/reports', {
        targetType: 'POST',
        targetId: post.id,
        reason: 'Reported by user',
      });
      setReported(true);
      addToast('success', 'Post reported. Our moderators will review it.');
    } catch {
      addToast('error', 'Failed to report post');
    }
  };

  return (
    <article className="max-w-3xl mx-auto">
      {/* Media */}
      {primaryMedia && (
        <div className="mb-4">
          <MediaPlayer media={primaryMedia} />
        </div>
      )}

      {/* Title */}
      <h1 className="text-xl font-bold text-text-primary leading-tight mb-3">
        {post.title}
      </h1>

      {/* Author + meta */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/20">
        <Avatar src={post.author.avatarUrl} name={post.author.username} size={36} />
        <div className="min-w-0">
          <Link
            href={`/u/${post.author.username}`}
            className="text-sm font-semibold text-text-primary hover:text-accent transition-colors"
          >
            {post.author.username}
          </Link>
          <div className="text-xs text-text-muted">{timeAgo(post.createdAt)}</div>
        </div>

        <div className="ml-auto">
          <Link
            href={`/c/${post.community.slug}`}
            className="text-sm text-text-link hover:underline"
          >
            c/{post.community.name}
          </Link>
        </div>
      </div>

      {/* Body */}
      {post.body && (
        <div className="mb-4 text-sm text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {post.body}
        </div>
      )}

      {/* Tags */}
      {post.games.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.games.map((game) => (
            <GameChip key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4 border-b border-black/20">
        <VoteControls
          postId={post.id}
          initialScore={post.score}
          initialUserVote={post.vote ?? 0}
          compact={false}
        />

        <div className="flex items-center gap-1 text-sm text-text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>{post.commentCount} comments</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={reported}
          className="ml-auto"
        >
          {reported ? 'Reported' : 'Report'}
        </Button>
      </div>
    </article>
  );
}
