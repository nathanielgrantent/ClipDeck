'use client';

import { useState } from 'react';
import { useCommunity, usePosts } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { cn, timeAgo } from '@/lib/utils';
import { apiPost } from '@/lib/client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { Post } from '@gamingclips/shared';

const SORT_TABS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
] as const;

type SortKey = (typeof SORT_TABS)[number]['key'];

function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/p/${post.id}`}>
      <div className="flex gap-3 rounded-card bg-surface border border-black/20 p-3 transition-colors hover:border-white/20">
        {post.media[0] && (
          <div className="shrink-0 overflow-hidden rounded-btn bg-black" style={{ width: 120, height: 80 }}>
            {post.media[0].type === 'VIDEO' ? (
              <video
                src={post.media[0].thumbnailUrl || post.media[0].hlsUrl || undefined}
                poster={post.media[0].thumbnailUrl || undefined}
                muted
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={post.media[0].originalUrl || post.media[0].thumbnailUrl || ''}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{post.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <Avatar src={post.author.avatarUrl} name={post.author.username} size={16} />
            <span className="text-text-secondary">{post.author.username}</span>
            <span>·</span>
            <span>{timeAgo(post.createdAt)}</span>
          </div>
          <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5l7 9H5l7-9z" />
              </svg>
              {post.score}
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {post.commentCount}
            </span>
            {post.games.length > 0 && (
              <span className="chip bg-sidebar-hover text-text-secondary">
                {post.games[0].name}
              </span>
            )}
            <span className="ml-auto capitalize chip bg-sidebar-hover text-text-secondary">
              {post.type.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommunityHeader({
  community,
  isSubscribed,
  onToggleSubscribe,
}: {
  community: { name: string; description: string; memberCount: number; postCount: number; avatarUrl: string | null; bannerUrl: string | null };
  isSubscribed: boolean;
  onToggleSubscribe: () => void;
}) {
  return (
    <div className="mb-6">
      {community.bannerUrl && (
        <div className="relative h-32 overflow-hidden rounded-card sm:h-48">
          <img
            src={community.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className={cn('flex items-end gap-4', community.bannerUrl ? '-mt-8 relative px-4' : 'px-0')}>
        <Avatar src={community.avatarUrl} name={community.name} size={64} className="ring-4 ring-content" />
        <div className="flex-1 pb-1">
          <h1 className="text-xl font-bold text-text-primary">{community.name}</h1>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{community.memberCount.toLocaleString()} members</span>
            <span>·</span>
            <span>{community.postCount.toLocaleString()} posts</span>
          </div>
        </div>
        <button
          onClick={onToggleSubscribe}
          className={cn(
            'btn text-xs',
            isSubscribed ? 'bg-sidebar-hover text-text-secondary hover:bg-sidebar-active' : 'btn-primary',
          )}
        >
          {isSubscribed ? 'Joined' : 'Join'}
        </button>
      </div>
      {community.description && (
        <p className="mt-3 text-sm text-text-secondary">{community.description}</p>
      )}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="flex gap-3 rounded-card bg-surface border border-black/20 p-3">
      <div className="h-20 w-[120px] shrink-0 rounded-btn bg-sidebar-hover animate-pulse" />
      <div className="flex-1 space-y-2">
        <Skeleton lines={1} className="w-3/4" />
        <Skeleton lines={1} className="w-1/3" />
        <Skeleton lines={1} className="w-1/2 mt-2" />
      </div>
    </div>
  );
}

export default function CommunityPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [sort, setSort] = useState<SortKey>('hot');
  const { community, isLoading: communityLoading, error: communityError } = useCommunity(slug);
  const { posts, isLoading: postsLoading } = usePosts(slug, 50);
  const { status } = useSession();
  const [subscribed, setSubscribed] = useState(false);

  if (communityLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6 space-y-3">
          <div className="flex items-end gap-4">
            <Skeleton variant="avatar" className="!h-16 !w-16" />
            <div className="space-y-2">
              <Skeleton lines={1} className="w-32" />
              <Skeleton lines={1} className="w-24" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (communityError || !community) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="text-5xl">🔍</div>
        <h1 className="text-xl font-semibold text-text-primary">Community not found</h1>
        <p className="text-sm text-text-secondary">
          The community you are looking for does not exist or has been removed.
        </p>
        <Link href="/" className="btn-primary mt-2">
          Back to Home
        </Link>
      </div>
    );
  }

  async function toggleSubscribe() {
    if (status !== 'authenticated') {
      window.location.href = '/login';
      return;
    }
    try {
      await apiPost(`/api/communities/${slug}/subscribe`);
      setSubscribed((s) => !s);
    } catch {
      // silent
    }
  }

  return (
    <AppShell activeSlug={slug}>
      <div className="p-4 sm:p-6">
        <CommunityHeader
          community={community}
          isSubscribed={community.subscribed ?? subscribed}
          onToggleSubscribe={toggleSubscribe}
        />

        <div className="mb-4 flex rounded-btn bg-sidebar p-0.5">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className={cn(
                'rounded-btn px-3 py-1.5 text-xs font-medium transition-colors',
                sort === tab.key ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">📝</div>
            <h2 className="text-lg font-semibold text-text-primary">No posts yet</h2>
            <p className="text-sm text-text-secondary">
              Be the first to post in this community!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostRow key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
