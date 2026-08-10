import { describe, it, expect, vi } from 'vitest';

describe('validation - createPostSchema', () => {
  it('accepts valid post data', async () => {
    const { createPostSchema } = await import('@/lib/validation');
    const result = createPostSchema.safeParse({
      communitySlug: 'my-community',
      title: 'Cool clip',
      body: 'Check this out',
      type: 'CLIP',
      assetId: 'clxyz1234567890123456789',
      gameIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', async () => {
    const { createPostSchema } = await import('@/lib/validation');
    const result = createPostSchema.safeParse({
      communitySlug: 'my-community',
      title: '',
      type: 'CLIP',
      assetId: 'clxyz1234567890123456789',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', async () => {
    const { createPostSchema } = await import('@/lib/validation');
    const result = createPostSchema.safeParse({
      communitySlug: 'my-community',
      title: 'Test',
      type: 'VIDEO',
      assetId: 'clxyz1234567890123456789',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid assetId format', async () => {
    const { createPostSchema } = await import('@/lib/validation');
    const result = createPostSchema.safeParse({
      communitySlug: 'my-community',
      title: 'Test',
      type: 'CLIP',
      assetId: 'not-a-cuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts IMAGE type', async () => {
    const { createPostSchema } = await import('@/lib/validation');
    const result = createPostSchema.safeParse({
      communitySlug: 'my-community',
      title: 'Screenshot',
      type: 'IMAGE',
      assetId: 'clxyz1234567890123456789',
    });
    expect(result.success).toBe(true);
  });
});

describe('validation - createCommentSchema', () => {
  it('accepts valid comment', async () => {
    const { createCommentSchema } = await import('@/lib/validation');
    const result = createCommentSchema.safeParse({
      postId: 'clxyz1234567890123456789',
      body: 'Great clip!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty body', async () => {
    const { createCommentSchema } = await import('@/lib/validation');
    const result = createCommentSchema.safeParse({
      postId: 'clxyz1234567890123456789',
      body: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid postId', async () => {
    const { createCommentSchema } = await import('@/lib/validation');
    const result = createCommentSchema.safeParse({
      postId: 'invalid',
      body: 'Hello',
    });
    expect(result.success).toBe(false);
  });

  it('accepts parentId', async () => {
    const { createCommentSchema } = await import('@/lib/validation');
    const result = createCommentSchema.safeParse({
      postId: 'clxyz1234567890123456789',
      body: 'Reply',
      parentId: 'clxyz1234567890123456789',
    });
    expect(result.success).toBe(true);
  });
});

describe('validation - createCommunitySchema', () => {
  it('accepts valid community', async () => {
    const { createCommunitySchema } = await import('@/lib/validation');
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      slug: 'my-community',
      description: 'A cool place',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug format', async () => {
    const { createCommunitySchema } = await import('@/lib/validation');
    const result = createCommunitySchema.safeParse({
      name: 'My Community',
      slug: 'MY COMMUNITY!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name too short', async () => {
    const { createCommunitySchema } = await import('@/lib/validation');
    const result = createCommunitySchema.safeParse({
      name: 'A',
      slug: 'a',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', async () => {
    const { createCommunitySchema } = await import('@/lib/validation');
    const result = createCommunitySchema.safeParse({
      name: 'Test',
      slug: 'MySlug',
    });
    expect(result.success).toBe(false);
  });
});

describe('validation - voteSchema', () => {
  it('accepts 1, -1, 0', async () => {
    const { voteSchema } = await import('@/lib/validation');
    expect(voteSchema.safeParse({ postId: 'clxyz1234567890123456789', value: 1 }).success).toBe(true);
    expect(voteSchema.safeParse({ postId: 'clxyz1234567890123456789', value: -1 }).success).toBe(true);
    expect(voteSchema.safeParse({ postId: 'clxyz1234567890123456789', value: 0 }).success).toBe(true);
  });

  it('rejects other values', async () => {
    const { voteSchema } = await import('@/lib/validation');
    expect(voteSchema.safeParse({ postId: 'clxyz1234567890123456789', value: 2 }).success).toBe(false);
    expect(voteSchema.safeParse({ postId: 'clxyz1234567890123456789', value: -2 }).success).toBe(false);
  });
});

describe('validation - reportSchema', () => {
  it('accepts valid report', async () => {
    const { reportSchema } = await import('@/lib/validation');
    const result = reportSchema.safeParse({
      targetType: 'POST',
      targetId: 'clxyz1234567890123456789',
      reason: 'This is spam content',
    });
    expect(result.success).toBe(true);
  });

  it('rejects reason too short', async () => {
    const { reportSchema } = await import('@/lib/validation');
    const result = reportSchema.safeParse({
      targetType: 'POST',
      targetId: 'clxyz1234567890123456789',
      reason: 'ab',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid targetType', async () => {
    const { reportSchema } = await import('@/lib/validation');
    const result = reportSchema.safeParse({
      targetType: 'COMMENTARY',
      targetId: 'clxyz1234567890123456789',
      reason: 'Spam',
    });
    expect(result.success).toBe(false);
  });
});

describe('validation - modActionSchema', () => {
  it('accepts valid mod action', async () => {
    const { modActionSchema } = await import('@/lib/validation');
    const result = modActionSchema.safeParse({
      targetType: 'POST',
      targetId: 'clxyz1234567890123456789',
      action: 'REMOVE',
      reason: 'Spam',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid action', async () => {
    const { modActionSchema } = await import('@/lib/validation');
    const result = modActionSchema.safeParse({
      targetType: 'POST',
      targetId: 'clxyz1234567890123456789',
      action: 'DELETE',
    });
    expect(result.success).toBe(false);
  });
});
