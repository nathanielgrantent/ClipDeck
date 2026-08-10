import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

const nextLinkMock = vi.hoisted(() => ({
  default: ({ children }: any) => {
    // Handle both single child and array of children using React.createElement
    return Array.isArray(children)
      ? React.createElement(React.Fragment, null, ...children)
      : children;
  },
}));

vi.mock('next/link', () => nextLinkMock);

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ name, ...props }: any) => (
    <span data-testid="avatar" {...props}>{name?.[0]}</span>
  ),
}));
vi.mock('@/components/post/vote-controls', () => ({
  VoteControls: ({ postId, initialScore }: any) => (
    <div data-testid="vote-controls">{initialScore}</div>
  ),
}));
vi.mock('@/components/game/game-chip', () => ({
  GameChip: ({ game }: any) => <span data-testid="game-chip">{game.name}</span>,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  timeAgo: () => '2h ago',
}));

const makePost = (overrides: any = {}) => ({
  id: 'post-1',
  title: 'Epic Valorant Ace',
  body: 'Watch this insane clutch',
  type: 'CLIP' as const,
  status: 'VISIBLE' as const,
  score: 142,
  commentCount: 23,
  vote: 0 as const,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  automodReasons: [],
  author: {
    id: 'u1',
    username: 'proplayer',
    avatarUrl: null,
    role: 'USER' as const,
    status: 'online' as const,
    karma: 500,
    createdAt: '2024-01-01',
    banned: false,
  },
  community: {
    id: 'c1',
    slug: 'valorant',
    name: 'Valorant',
    description: '',
    rules: [],
    avatarUrl: null,
    bannerUrl: null,
    ownerId: 'u1',
    sfw: true,
    memberCount: 1000,
    postCount: 200,
    createdAt: '2024-01-01',
  },
  games: [
    {
      id: 'g1',
      name: 'Valorant',
      platform: 'PC' as const,
      coverUrl: null,
      steamAppId: null,
      aliases: [],
      popularity: 100,
    },
  ],
  media: [
    {
      id: 'm1',
      type: 'VIDEO' as const,
      mime: 'video/mp4',
      sizeBytes: 1000000,
      width: 1920,
      height: 1080,
      durationSeconds: 45,
      status: 'READY' as const,
      hlsUrl: '/media/hls/test.m3u8',
      thumbnailUrl: '/media/thumbs/test.jpg',
      originalUrl: '/media/originals/test.mp4',
      createdAt: '2025-01-01',
    },
  ],
  ...overrides,
});

describe('PostCard', () => {
  it('renders post title', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('Epic Valorant Ace')).toBeDefined();
  });

  it('renders community name', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('c/Valorant')).toBeDefined();
  });

  it('renders author username', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('u/proplayer')).toBeDefined();
  });

  it('renders body text when present', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('Watch this insane clutch')).toBeDefined();
  });

  it('does not render body when null', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost({ body: null })} />);
    expect(screen.queryByText('Watch this insane clutch')).toBeNull();
  });

  it('renders game chips', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('Valorant')).toBeDefined();
  });

  it('renders comment count', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('23')).toBeDefined();
  });

  it('renders vote controls', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByTestId('vote-controls')).toBeDefined();
  });

  it('renders video duration', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    render(<PostCard post={makePost()} />);
    expect(screen.getByText('0:45')).toBeDefined();
  });

  it('renders IMAGE post type indicator', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    const post = makePost({
      type: 'IMAGE',
      media: [{
        id: 'm1',
        type: 'IMAGE',
        mime: 'image/png',
        sizeBytes: 500000,
        width: 800,
        height: 600,
        durationSeconds: null,
        status: 'READY',
        hlsUrl: null,
        thumbnailUrl: '/media/thumbs/test.jpg',
        originalUrl: '/media/originals/test.png',
        createdAt: '2025-01-01',
      }],
    });
    render(<PostCard post={post} />);
    expect(screen.getByText('Epic Valorant Ace')).toBeDefined();
  });

  it('renders +N when more than 3 games', async () => {
    const { PostCard } = await import('@/components/post/post-card');
    const post = makePost({
      games: [
        { id: 'g1', name: 'Game1', platform: 'PC', coverUrl: null, steamAppId: null, aliases: [], popularity: 10 },
        { id: 'g2', name: 'Game2', platform: 'PS5', coverUrl: null, steamAppId: null, aliases: [], popularity: 10 },
        { id: 'g3', name: 'Game3', platform: 'XBOX', coverUrl: null, steamAppId: null, aliases: [], popularity: 10 },
        { id: 'g4', name: 'Game4', platform: 'SWITCH', coverUrl: null, steamAppId: null, aliases: [], popularity: 10 },
      ],
    });
    render(<PostCard post={post} />);
    expect(screen.getByText('+1')).toBeDefined();
  });
});
