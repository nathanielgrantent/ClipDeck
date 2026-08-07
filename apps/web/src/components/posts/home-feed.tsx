'use client';

import { useState } from 'react';
import { usePosts } from '@/hooks';
import { MasonryGallery } from '@/components/posts/masonry-gallery';
import { cn } from '@/lib/utils';

const SORTS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
] as const;

export function HomeFeed() {
  const [sort, setSort] = useState<'hot' | 'new' | 'top'>('hot');
  const { posts, isLoading, mutate } = usePosts(undefined, 60, sort);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-white/5 bg-content/90 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                'rounded-btn px-3 py-1 text-sm font-medium transition-colors',
                sort === s.key
                  ? 'bg-sidebar-active text-white'
                  : 'text-text-secondary hover:bg-sidebar-hover hover:text-white',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-text-muted">{posts.length} clips</div>
        <button
          onClick={() => mutate()}
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-sidebar-hover hover:text-text-primary"
          title="Refresh"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      <MasonryGallery posts={posts} loading={isLoading} />
    </div>
  );
}
