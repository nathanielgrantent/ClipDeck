import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, authMock } from '../mocks';

const getRoute = async () => import('@/app/api/upload/route');

describe('POST /api/upload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when fileName is missing', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileSize: 1000, contentType: 'video/mp4' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when fileSize is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName: 'clip.mp4', fileSize: -1, contentType: 'video/mp4' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported file type', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName: 'doc.pdf', fileSize: 1000, contentType: 'application/pdf' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 413 when file exceeds max upload size', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'huge.mp4',
        fileSize: 600 * 1024 * 1024,
        contentType: 'video/mp4',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('returns 413 when storage quota is exceeded', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({
      storageUsedBytes: BigInt(499 * 1024 * 1024),
      storageQuotaBytes: BigInt(500 * 1024 * 1024),
    });
    const { POST } = await getRoute();

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'clip.mp4',
        fileSize: 5 * 1024 * 1024,
        contentType: 'video/mp4',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
  });

  it('creates upload session for valid video', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({
      storageUsedBytes: BigInt(0),
      storageQuotaBytes: BigInt(500 * 1024 * 1024),
    });
    (prismaMock.mediaAsset.create as any).mockResolvedValue({
      id: 'asset-1',
      type: 'VIDEO',
      mime: 'video/mp4',
      status: 'PROCESSING',
    });

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'clip.mp4',
        fileSize: 10 * 1024 * 1024,
        contentType: 'video/mp4',
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.id).toBe('asset-1');
    expect(body.mediaType).toBe('VIDEO');
    expect(body.uploadUrl).toContain('/api/upload/asset-1');
  });

  it('creates upload session for valid image', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    (prismaMock.user.findUnique as any).mockResolvedValue({
      storageUsedBytes: BigInt(0),
      storageQuotaBytes: BigInt(500 * 1024 * 1024),
    });
    (prismaMock.mediaAsset.create as any).mockResolvedValue({
      id: 'asset-2',
      type: 'IMAGE',
      mime: 'image/png',
      status: 'PROCESSING',
    });

    const { POST } = await getRoute();
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'screenshot.png',
        fileSize: 500000,
        contentType: 'image/png',
      }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.mediaType).toBe('IMAGE');
  });
});
