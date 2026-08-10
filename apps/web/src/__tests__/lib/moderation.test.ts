import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks';

describe('moderation - applyVerdict', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns VISIBLE for ALLOW verdict', async () => {
    const { applyVerdict } = await import('@/lib/moderation');
    const tx = prismaMock as any;
    const result = await applyVerdict(tx, {
      targetType: 'POST',
      targetId: 'post-1',
      verdict: { action: 'ALLOW', evaluations: [], reasons: [], categories: [] },
      reasons: [],
    });
    expect(result.status).toBe('VISIBLE');
    expect(tx.post.update).not.toHaveBeenCalled();
  });

  it('sets REMOVED for REMOVE verdict on post', async () => {
    const { applyVerdict } = await import('@/lib/moderation');
    const tx = prismaMock as any;
    const result = await applyVerdict(tx, {
      targetType: 'POST',
      targetId: 'post-1',
      verdict: { action: 'REMOVE', evaluations: [], reasons: ['spam'], categories: ['SPAM'] },
      reasons: ['spam'],
    });
    expect(result.status).toBe('REMOVED');
    expect(tx.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { status: 'REMOVED', automodReasons: expect.any(String) },
    });
  });

  it('sets FILTERED and creates mod queue item for FILTER verdict', async () => {
    const { applyVerdict } = await import('@/lib/moderation');
    const tx = prismaMock as any;
    const result = await applyVerdict(tx, {
      targetType: 'COMMENT',
      targetId: 'comment-1',
      verdict: {
        action: 'FILTER',
        evaluations: [],
        reasons: ['new user'],
        categories: ['NEW_USER'],
      },
      reasons: ['new user'],
    });
    expect(result.status).toBe('FILTERED');
    expect(tx.comment.update).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
      data: { status: 'FILTERED', automodReasons: expect.any(String) },
    });
    expect(tx.modQueueItem.create).toHaveBeenCalled();
  });
});

describe('moderation - notifyUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a notification', async () => {
    const { notifyUser } = await import('@/lib/moderation');
    const tx = prismaMock as any;
    await notifyUser(tx, {
      userId: 'user-1',
      type: 'REPLY',
      title: 'Someone replied',
      body: 'Nice clip!',
      href: '/p/post-1',
    });
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'REPLY',
        title: 'Someone replied',
        body: 'Nice clip!',
        href: '/p/post-1',
      },
    });
  });
});

describe('moderation - logAction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a mod log entry', async () => {
    const { logAction } = await import('@/lib/moderation');
    const tx = prismaMock as any;
    await logAction(tx, {
      action: 'REMOVE',
      actorId: 'mod-1',
      targetType: 'POST',
      targetId: 'post-1',
      reason: 'Spam',
    });
    expect(tx.modLog.create).toHaveBeenCalledWith({
      data: {
        action: 'REMOVE',
        actorId: 'mod-1',
        targetType: 'POST',
        targetId: 'post-1',
        postId: 'post-1',
        commentId: null,
        reason: 'Spam',
      },
    });
  });
});

describe('moderation - loadRules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads enabled rules from database', async () => {
    (prismaMock.automodRule.findMany as any).mockResolvedValue([
      {
        id: 'r1',
        name: 'Spam filter',
        scope: 'GLOBAL',
        enabled: true,
        priority: 100,
        conditions: '{"keywords":["spam"]}',
        actions: '[{"action":"REMOVE","reason":"Spam"}]',
        scoreThreshold: null,
        escalateTo: null,
        community: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { loadRules } = await import('@/lib/moderation');
    const rules = await loadRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].name).toBe('Spam filter');
    expect(rules[0].conditions).toEqual({ keywords: ['spam'] });
  });

  it('filters by community slug when provided', async () => {
    (prismaMock.automodRule.findMany as any).mockResolvedValue([]);
    const { loadRules } = await import('@/lib/moderation');
    await loadRules('my-community');
    expect(prismaMock.automodRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'COMMUNITY', communityId: 'my-community' },
          ],
        }),
      }),
    );
  });
});
