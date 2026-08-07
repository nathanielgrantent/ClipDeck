'use client';

import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { Community, Me, Post } from '@gamingclips/shared';
import { apiGet } from '@/lib/client';

export function useMe() {
  const { data: session } = useSession();
  const { data, error, isLoading, mutate } = useSWR<Me>(
    session ? '/api/me' : null,
    apiGet,
    { revalidateOnFocus: false },
  );
  return { me: data, error, isLoading, mutate };
}

export function useCommunities() {
  const { data, error, isLoading, mutate } = useSWR<Community[]>(
    '/api/communities?sort=members',
    apiGet,
    { revalidateOnFocus: false },
  );
  return { communities: data ?? [], error, isLoading, mutate };
}

export function useCommunity(slug: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Community>(
    slug ? `/api/communities/${slug}` : null,
    apiGet,
  );
  return { community: data, error, isLoading, mutate };
}

export function usePosts(communitySlug?: string, limit = 50, sort?: 'hot' | 'new' | 'top') {
  const params = new URLSearchParams();
  if (communitySlug) params.set('community', communitySlug);
  if (sort) params.set('sort', sort);
  params.set('limit', String(limit));
  const key = `/api/posts?${params.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<{ posts: Post[]; nextCursor: string | null }>(
    key,
    apiGet,
    { revalidateOnFocus: false },
  );
  return { posts: data?.posts ?? [], nextCursor: data?.nextCursor, error, isLoading, mutate };
}

export function usePost(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Post>(id ? `/api/posts/${id}` : null, apiGet);
  return { post: data, error, isLoading, mutate };
}

export function useGameSearch(query: string, enabled = true) {
  const { data, error, isLoading } = useSWR<import('@gamingclips/shared').Game[]>(
    enabled && query.trim().length > 0 ? `/api/games/search?q=${encodeURIComponent(query)}` : null,
    apiGet,
  );
  return { games: data ?? [], error, isLoading };
}

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<import('@gamingclips/shared').Notification[]>(
    '/api/notifications',
    apiGet,
    { revalidateOnFocus: false },
  );
  return { notifications: data ?? [], error, isLoading, mutate };
}
