'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Community } from '@gamingclips/shared';

export const CommunityCard = memo(function CommunityCard({ community }: { community: Community }) {
  return (
    <Link
      href={`/c/${community.slug}`}
      className="card flex items-center gap-3 p-3 transition-colors hover:border-white/20 group"
    >
      <Avatar src={community.avatarUrl} name={community.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
            {community.name}
          </h3>
          {community.subscribed && (
            <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              Joined
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
          {community.description || 'No description'}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted/70">
          <span>{community.memberCount.toLocaleString()} members</span>
          <span>&middot;</span>
          <span>{community.postCount.toLocaleString()} posts</span>
        </div>
      </div>
    </Link>
  );
});
