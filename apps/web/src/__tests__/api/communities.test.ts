import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, authMock } from '../mocks';

const getRoute = async () => import('@/app/api/communities/route');

describe('POST /api/communities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/communities', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when validation fails', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/communities', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 when slug is already taken', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.community.findUnique as any).mockResolvedValue({ id: 'existing', slug: 'my-community' });
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/communities', {
      method: 'POST',
      body: JSON.stringify({
        name: 'My Community',
        slug: 'my-community',
        description: 'A cool community',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('creates community and auto-subscribes owner', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.community.findUnique as any).mockResolvedValue(null);
    (prismaMock.community.create as any).mockResolvedValue({
      id: 'comm-1',
      slug: 'new-community',
      name: 'New Community',
      description: 'Hello',
      rules: '[]',
      ownerId: 'user-1',
      sfw: true,
      avatarUrl: null,
      bannerUrl: null,
      createdAt: new Date(),
      _count: { subscriptions: 0, posts: 0 },
    });
    (prismaMock.subscription.create as any).mockResolvedValue({});

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/communities', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Community',
        slug: 'new-community',
        description: 'Hello',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prismaMock.subscription.create).toHaveBeenCalled();
  });
});

describe('GET /api/communities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns communities sorted by members', async () => {
    authMock.mockResolvedValue(null);
    (prismaMock.community.findMany as any).mockResolvedValue([
      {
        id: 'c1', slug: 'alpha', name: 'Alpha', description: '', rules: '[]',
        ownerId: 'u1', sfw: true, avatarUrl: null, bannerUrl: null, createdAt: new Date(),
        _count: { subscriptions: 100, posts: 50 },
      },
      {
        id: 'c2', slug: 'beta', name: 'Beta', description: '', rules: '[]',
        ownerId: 'u2', sfw: true, avatarUrl: null, bannerUrl: null, createdAt: new Date(),
        _count: { subscriptions: 50, posts: 25 },
      },
    ]);

    const { GET } = await getRoute();
    const req = new Request('http://localhost/api/communities?sort=members');
    const res = await GET(req);
    const body = await res.json();
    expect(body.length).toBe(2);
    expect(body[0].memberCount).toBeGreaterThanOrEqual(body[1].memberCount);
  });

  it('filters communities by search query', async () => {
    authMock.mockResolvedValue(null);
    (prismaMock.community.findMany as any).mockResolvedValue([]);

    const { GET } = await getRoute();
    const req = new Request('http://localhost/api/communities?q=fortnite');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(prismaMock.community.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ name: { contains: 'fortnite' } }, { slug: { contains: 'fortnite' } }],
        }),
      }),
    );
  });
});
