import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, authMock } from '../mocks';
import { isBanned } from '@/lib/moderators';

// We need to re-import after mocks are set up
const getRoute = async () => import('@/app/api/posts/route');
const getVoteRoute = async () => import('@/app/api/posts/[id]/vote/route');

describe('POST /api/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isBanned as any).mockResolvedValue(false);
    (prismaMock.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      username: 'testuser',
      role: 'USER',
      karma: 10,
      banned: false,
      createdAt: new Date(),
    });
  });

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is banned', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { isBanned } = await import('@/lib/moderators');
    (isBanned as any).mockResolvedValue(true);

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 on invalid body', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when validation fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when community not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.community.findUnique as any).mockResolvedValue(null);
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        communitySlug: 'nonexistent',
        title: 'Test Post',
        type: 'CLIP',
        assetId: 'clxyz1234567890123456789',
        gameIds: [],
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Community not found');
  });

  it('returns 400 when asset not owned by user', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.community.findUnique as any).mockResolvedValue({ id: 'comm-1', slug: 'test' });
    (prismaMock.mediaAsset.findUnique as any).mockResolvedValue({
      id: 'asset-1',
      userId: 'user-other',
      status: 'READY',
      type: 'VIDEO',
    });

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        communitySlug: 'test',
        title: 'Test Post',
        type: 'CLIP',
        assetId: 'clxyz1234567890123456789',
        gameIds: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty posts for unknown community', async () => {
    authMock.mockResolvedValue(null);
    (prismaMock.community.findUnique as any).mockResolvedValue(null);
    const { GET } = await getRoute();

    const req = new Request('http://localhost/api/posts?community=unknown');
    const res = await GET(req);
    const body = await res.json();
    expect(body.posts).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it('returns posts with cursor pagination', async () => {
    authMock.mockResolvedValue(null);
    (prismaMock.community.findUnique as any).mockResolvedValue(null);
    (prismaMock.post.findMany as any).mockResolvedValue(
      Array.from({ length: 4 }, (_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        score: i,
        createdAt: new Date(),
        _count: { comments: 0 },
        author: { id: 'u1', username: 'a', role: 'USER', karma: 0, banned: false, createdAt: new Date() },
        community: { id: 'c1', name: 'C', slug: 'c', _count: { subscriptions: 0, posts: 0 } },
        games: [],
        media: [],
        automodReasons: [],
      })),
    );

    const { GET } = await getRoute();
    const req = new Request('http://localhost/api/posts?limit=3');
    const res = await GET(req);
    const body = await res.json();
    expect(body.posts).toHaveLength(3);
    expect(body.nextCursor).toBe('post-2');
  });
});

describe('POST /api/posts/[id]/vote', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await getVoteRoute();
    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid vote value', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getVoteRoute();
    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 5 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when post not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue(null);
    const { POST } = await getVoteRoute();

    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when voting on own post', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'user-1', score: 0 });
    const { POST } = await getVoteRoute();

    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain('own post');
  });

  it('creates upvote and increments score', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'user-2', score: 0 });
    (prismaMock.vote.findUnique as any).mockResolvedValue(null);
    (prismaMock.vote.create as any).mockResolvedValue({});
    (prismaMock.post.update as any).mockResolvedValue({ score: 1 });

    const { POST } = await getVoteRoute();
    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.score).toBe(1);
    expect(body.vote).toBe(1);
  });

  it('removes vote when value is 0', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'user-2', score: 1 });
    (prismaMock.vote.findUnique as any).mockResolvedValue({ id: 'v1', value: 1 });
    (prismaMock.vote.delete as any).mockResolvedValue({});
    (prismaMock.post.update as any).mockResolvedValue({ score: 0 });

    const { POST } = await getVoteRoute();
    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: 0 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(200);
    expect(prismaMock.vote.delete).toHaveBeenCalled();
  });

  it('changes vote from up to down', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue({ id: 'p1', authorId: 'user-2', score: 1 });
    (prismaMock.vote.findUnique as any).mockResolvedValue({ id: 'v1', value: 1 });
    (prismaMock.vote.update as any).mockResolvedValue({});
    (prismaMock.post.update as any).mockResolvedValue({ score: -1 });

    const { POST } = await getVoteRoute();
    const req = new Request('http://localhost/api/posts/p1/vote', {
      method: 'POST',
      body: JSON.stringify({ value: -1 }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) });
    const body = await res.json();
    expect(body.score).toBe(-1);
    expect(body.vote).toBe(-1);
    expect(prismaMock.vote.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { value: -1 },
    });
  });
});
