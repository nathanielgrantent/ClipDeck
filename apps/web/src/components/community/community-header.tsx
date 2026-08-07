'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { apiPost } from '@/lib/client';
import { cn, timeAgo } from '@/lib/utils';
import type { Community } from '@gamingclips/shared';

export function CommunityHeader({ community }: { community: Community }) {
  const [subscribed, setSubscribed] = useState(community.subscribed ?? false);
  const [memberCount, setMemberCount] = useState(community.memberCount);
  const [pending, setPending] = useState(false);
  const { addToast } = useToast();

  const toggleSubscribe = useCallback(async () => {
    if (pending) return;
    setPending(true);
    const wasSubscribed = subscribed;
    setSubscribed(!wasSubscribed);
    setMemberCount((c) => (wasSubscribed ? c - 1 : c + 1));

    try {
      await apiPost(`/api/communities/${community.slug}/subscribe`);
    } catch {
      setSubscribed(wasSubscribed);
      setMemberCount((c) => (wasSubscribed ? c + 1 : c - 1));
      addToast('error', 'Failed to update subscription');
    } finally {
      setPending(false);
    }
  }, [community.slug, subscribed, pending, addToast]);

  return (
    <div className="relative">
      {/* Banner */}
      {community.bannerUrl && (
        <div className="h-32 sm:h-48 w-full overflow-hidden rounded-t-card">
          <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      {!community.bannerUrl && (
        <div className="h-32 sm:h-48 w-full rounded-t-card bg-gradient-to-br from-accent/30 to-surface" />
      )}

      {/* Header content */}
      <div className="relative px-4 sm:px-6 pb-4">
        <div className="flex items-end gap-4 -mt-8">
          <div className="shrink-0 rounded-full border-4 border-content bg-content">
            <Avatar src={community.avatarUrl} name={community.name} size={72} />
          </div>
          <div className="min-w-0 pb-1 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">
              {community.name}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-text-muted">
          <span>{memberCount.toLocaleString()} members</span>
          <span>&middot;</span>
          <span>{community.postCount.toLocaleString()} posts</span>
          <span>&middot;</span>
          <span>Created {timeAgo(community.createdAt)}</span>
        </div>

        {community.description && (
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-2xl">
            {community.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={subscribed ? 'secondary' : 'primary'}
            size="sm"
            onClick={toggleSubscribe}
            loading={pending}
          >
            {subscribed ? 'Joined' : 'Join'}
          </Button>

          {community.isModerator && (
            <Link
              href={`/c/${community.slug}/mod`}
              className="btn-ghost text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                <path d="M12 1l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V4l8-3z" />
              </svg>
              Mod Tools
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
