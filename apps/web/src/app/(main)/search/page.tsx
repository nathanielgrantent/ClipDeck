'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePosts } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { cn, timeAgo } from '@/lib/utils';
import { apiGet } from '@/lib/client';
import Link from 'next/link';
import type { Post, Community } from '@gamingclips/shared';

function PostResult({ post }: { post: Post }) {
  return (
    <Link href={`/p/${post.id}`}>
      <div className="card p-4 transition-colors hover:border-white/20">
        <div className="flex items-start gap-3">
          {post.media[0] && (
            <div className="shrink-0 overflow-hidden rounded-btn bg-black" style={{ width: 80, height: 56 }}>
              {post.media[0].type === 'VIDEO' ? (
                <video
                  src={post.media[0].thumbnailUrl || undefined}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={post.media[0].originalUrl || post.media[0].thumbnailUrl || ''}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{post.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
              <Avatar src={post.author.avatarUrl} name={post.author.username} size={16} />
              <span className="text-text-secondary">{post.author.username}</span>
              <span>in {post.community.name}</span>
              <span>·</span>
              <span>{timeAgo(post.createdAt)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5l7 9H5l7-9z" />
                </svg>
                {post.score}
              </span>
              <span>{post.commentCount} comments</span>
              {post.games.length > 0 && (
                <span className="chip bg-sidebar-hover text-text-secondary">
                  {post.games[0].name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommunityResult({ community }: { community: Community }) {
  return (
    <Link href={`/c/${community.slug}`}>
      <div className="card flex items-center gap-3 p-4 transition-colors hover:border-white/20">
        <Avatar src={community.avatarUrl} name={community.name} size={40} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{community.name}</h3>
          <p className="text-xs text-text-muted">
            {community.memberCount.toLocaleString()} members · {community.postCount.toLocaleString()} posts
          </p>
        </div>
        {community.subscribed && (
          <span className="chip bg-accent/10 text-accent text-[10px]">Joined</span>
        )}
      </div>
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { posts, isLoading: postsLoading } = usePosts(undefined, 30);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) return;
    let cancelled = false;
    apiGet<Community[]>(`/api/communities?q=${encodeURIComponent(query)}&sort=members`)
      .then((data) => {
        if (!cancelled) {
          setCommunities(data);
          setLastQuery(query);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCommunities([]);
          setLastQuery(query);
        }
      });
    return () => { cancelled = true; };
  }, [query]);

  const communityLoading = !!query.trim() && lastQuery !== query;

  const filteredPosts = query.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.body?.toLowerCase().includes(query.toLowerCase()),
      )
    : posts;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
          {!query && (
            <p className="mt-1 text-sm text-text-secondary">
              Use the search bar to find posts and communities.
            </p>
          )}
        </div>

        {!query && !postsLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🔍</div>
            <h2 className="text-lg font-semibold text-text-primary">Search ClipDeck</h2>
            <p className="text-sm text-text-secondary">
              Find clips, screenshots, and communities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {communityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            ) : communities.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-text-primary">Communities</h2>
                <div className="space-y-2">
                  {communities.slice(0, 5).map((c) => (
                    <CommunityResult key={c.id} community={c} />
                  ))}
                </div>
              </div>
            ) : null}

            {postsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="card" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-text-primary">Posts</h2>
                <div className="space-y-2">
                  {filteredPosts.slice(0, 20).map((post) => (
                    <PostResult key={post.id} post={post} />
                  ))}
                </div>
              </div>
            ) : query ? (
              <div className="py-12 text-center">
                <p className="text-sm text-text-secondary">No posts found matching your search.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="mx-auto max-w-2xl p-4 sm:p-6">
            <Skeleton lines={1} className="w-48 mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          </div>
        </AppShell>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
