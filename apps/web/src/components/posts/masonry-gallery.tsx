'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Post } from '@gamingclips/shared';
import { PostCard } from '@/components/posts/post-card';
import { Spinner } from '@/components/ui/button';

export function MasonryGallery({
  posts,
  loading,
  muted = true,
}: {
  posts: Post[];
  loading: boolean;
  muted?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    function compute() {
      const w = containerRef.current?.clientWidth ?? 1200;
      const n = Math.max(2, Math.min(6, Math.floor(w / 260)));
      setCols(n);
    }
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const columns = useMemo(() => {
    const colsArr = Array.from({ length: cols }, () => [] as Post[]);
    posts.forEach((p, i) => colsArr[i % cols].push(p));
    return colsArr;
  }, [posts, cols]);

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-[1400px] px-4 py-4">
      {loading && posts.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-text-muted" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex gap-4" style={{ columnCount: cols }}>
          {columns.map((col, i) => (
            <div key={i} className="flex flex-1 flex-col gap-4 contain-layout">
              {col.map((p) => (
                <PostCard key={p.id} post={p} muted={muted} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <div className="text-4xl">🎮</div>
      <p className="text-sm font-medium text-text-primary">No clips yet</p>
      <p className="max-w-xs text-xs text-text-muted">
        Be the first to share a clip or screenshot. Head to the upload page to get started.
      </p>
    </div>
  );
}
