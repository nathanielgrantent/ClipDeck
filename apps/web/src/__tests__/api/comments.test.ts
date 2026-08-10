import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, authMock } from '../mocks';

const getRoute = async () => import('@/app/api/comments/route');

const mockPost = {
  id: 'post-1',
  status: 'VISIBLE',
  community: { slug: 'test-community', id: 'comm-1' },
};

const mockAuthor = {
  id: 'user-1',
  username: 'testuser',
  role: 'USER',
  karma: 10,
  banned: false,
  createdAt: new Date(),
};

describe('POST /api/comments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when validation fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId: 'not-a-cuid', body: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when post not found', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue(null);
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId: 'clxyz1234567890123456789', body: 'Nice clip!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when post is not visible', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue({ ...mockPost, status: 'REMOVED' });
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId: 'clxyz1234567890123456789', body: 'Nice clip!' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates a comment successfully', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue(mockPost);
    (prismaMock.user.findUnique as any).mockResolvedValue(mockAuthor);
    (prismaMock.comment.create as any).mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      parentId: null,
      body: 'Nice clip!',
      authorId: 'user-1',
      status: 'VISIBLE',
      automodReasons: [],
      createdAt: new Date(),
      _count: { children: 0 },
      author: mockAuthor,
    });

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'clxyz1234567890123456789',
        body: 'Nice clip!',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prismaMock.comment.create).toHaveBeenCalled();
  });

  it('returns 400 when parent comment is from different post', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.post.findUnique as any).mockResolvedValue(mockPost);
    (prismaMock.comment.findUnique as any).mockResolvedValue({
      id: 'parent-1',
      postId: 'other-post',
      authorId: 'user-2',
    });
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        postId: 'clxyz1234567890123456789',
        body: 'Reply',
        parentId: 'clxyz123456789012345678a',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/comments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when postId is missing', async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await getRoute();
    const req = new Request('http://localhost/api/comments');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns comments as a tree', async () => {
    authMock.mockResolvedValue(null);
    const comments = [
      {
        id: 'c1', postId: 'p1', parentId: null, body: 'Root', status: 'VISIBLE',
        createdAt: new Date(), authorId: 'u1', score: 5, automodReasons: [],
        author: mockAuthor, _count: { children: 1 },
      },
      {
        id: 'c2', postId: 'p1', parentId: 'c1', body: 'Reply', status: 'VISIBLE',
        createdAt: new Date(), authorId: 'u2', score: 2, automodReasons: [],
        author: { ...mockAuthor, id: 'u2', username: 'other' }, _count: { children: 0 },
      },
    ];
    (prismaMock.comment.findMany as any).mockResolvedValue(comments);
    (prismaMock.vote.findMany as any).mockResolvedValue([]);

    const { GET } = await getRoute();
    const req = new Request('http://localhost/api/comments?postId=clxyz1234567890123456789');
    const res = await GET(req);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});
