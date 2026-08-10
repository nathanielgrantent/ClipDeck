import { describe, it, expect, vi } from 'vitest';
import path from 'path';

describe('storage - resolveUploadPath', () => {
  it('resolves a safe path inside upload dir', async () => {
    const { resolveUploadPath } = await import('@/lib/storage');
    const result = resolveUploadPath('originals/user1/abc.mp4');
    expect(result).toContain('originals');
    expect(result).toContain('abc.mp4');
  });

  it('throws on path traversal with ..', async () => {
    const { resolveUploadPath } = await import('@/lib/storage');
    expect(() => resolveUploadPath('../../../etc/passwd')).toThrow('Invalid path');
  });

  it('throws on absolute path traversal', async () => {
    const { resolveUploadPath } = await import('@/lib/storage');
    expect(() => resolveUploadPath('/etc/passwd')).toThrow('Invalid path');
  });

  it('resolves nested safe paths', async () => {
    const { resolveUploadPath } = await import('@/lib/storage');
    const result = resolveUploadPath('hls/user1/asset1/segment0.ts');
    expect(result).toContain('hls');
    expect(result).toContain('segment0.ts');
  });
});

describe('storage - path helpers', () => {
  it('originalRelativePath returns correct path', async () => {
    const { originalRelativePath } = await import('@/lib/storage');
    const result = originalRelativePath('user1', 'asset1', 'mp4');
    expect(result).toBe(path.join('originals', 'user1', 'asset1.mp4'));
  });

  it('hlsRelativePath returns correct path', async () => {
    const { hlsRelativePath } = await import('@/lib/storage');
    const result = hlsRelativePath('user1', 'asset1');
    expect(result).toBe(path.join('hls', 'user1', 'asset1'));
  });

  it('thumbRelativePath returns correct path', async () => {
    const { thumbRelativePath } = await import('@/lib/storage');
    const result = thumbRelativePath('user1', 'asset1', 'jpg');
    expect(result).toBe(path.join('thumbs', 'user1', 'asset1.jpg'));
  });

  it('thumbRelativePath defaults to jpg', async () => {
    const { thumbRelativePath } = await import('@/lib/storage');
    const result = thumbRelativePath('user1', 'asset1');
    expect(result).toContain('.jpg');
  });

  it('toPublicUrl converts backslashes to forward slashes', async () => {
    const { toPublicUrl } = await import('@/lib/storage');
    const input = path.join('originals', 'user1', 'file.mp4');
    const result = toPublicUrl(input);
    expect(result).toBe('/media/originals/user1/file.mp4');
  });
});

describe('storage - randomToken', () => {
  it('generates a hex token of default length', async () => {
    const { randomToken } = await import('@/lib/storage');
    const token = randomToken();
    expect(token).toHaveLength(48); // 24 bytes * 2 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('generates token of custom length', async () => {
    const { randomToken } = await import('@/lib/storage');
    const token = randomToken(8);
    expect(token).toHaveLength(16); // 8 bytes * 2 hex chars
  });
});
