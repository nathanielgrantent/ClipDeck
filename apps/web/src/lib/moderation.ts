import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { AutomodRule, AutomodVerdict } from '@gamingclips/shared';
import { parseJson, serializeStringArray } from '@gamingclips/shared';

export type Tx = Prisma.TransactionClient;

/** Load enabled rules: site-global first, then community-scoped (highest priority wins on ties). */
export async function loadRules(communityId?: string): Promise<AutomodRule[]> {
  const rules = await prisma.automodRule.findMany({
    where: {
      enabled: true,
      OR: communityId
        ? [{ scope: 'GLOBAL' }, { scope: 'COMMUNITY', communityId }]
        : [{ scope: 'GLOBAL' }],
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    include: { community: true },
  });

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    scope: r.scope === 'COMMUNITY' ? ('COMMUNITY' as const) : ('GLOBAL' as const),
    communitySlug: r.community?.slug ?? undefined,
    enabled: r.enabled,
    priority: r.priority,
    conditions: parseJson<AutomodRule['conditions']>(r.conditions, {}),
    actions: parseJson<AutomodRule['actions']>(r.actions, []),
    scoreThreshold: r.scoreThreshold ?? undefined,
    escalateTo: (r.escalateTo as AutomodRule['escalateTo']) ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/** Apply an automod verdict to a post or comment: set status + reasons, enqueue for review if FILTERED. */
export async function applyVerdict(
  tx: Tx,
  input: { targetType: 'POST' | 'COMMENT'; targetId: string; verdict: AutomodVerdict; reasons: string[] },
) {
  const { targetType, targetId, verdict, reasons } = input;
  if (verdict.action === 'ALLOW') return { status: 'VISIBLE' as const };

  const status = verdict.action === 'REMOVE' ? ('REMOVED' as const) : ('FILTERED' as const);

  if (targetType === 'POST') {
    await tx.post.update({
      where: { id: targetId },
      data: { status, automodReasons: serializeStringArray(reasons) },
    });
  } else {
    await tx.comment.update({
      where: { id: targetId },
      data: { status, automodReasons: serializeStringArray(reasons) },
    });
  }

  if (status === 'FILTERED') {
    await tx.modQueueItem.create({
      data: {
        kind: targetType,
        postId: targetType === 'POST' ? targetId : null,
        commentId: targetType === 'COMMENT' ? targetId : null,
        rules: serializeStringArray(verdict.reasons),
        categories: serializeStringArray(verdict.categories),
        status: 'PENDING',
      },
    });
  }

  return { status };
}

/** Record a ModLog entry. */
export async function logAction(tx: Tx, input: {
  action: string;
  actorId: string;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  reason?: string;
}) {
  await tx.modLog.create({
    data: {
      action: input.action,
      actorId: input.actorId,
      targetType: input.targetType,
      targetId: input.targetId,
      postId: input.targetType === 'POST' ? input.targetId : null,
      commentId: input.targetType === 'COMMENT' ? input.targetId : null,
      reason: input.reason ?? null,
    },
  });
}

/** Push a notification to a user. */
export async function notifyUser(tx: Tx, input: {
  userId: string;
  type: 'REPLY' | 'VOTE' | 'MENTION' | 'MOD_ACTION' | 'SYSTEM';
  title: string;
  body?: string;
  href?: string;
}) {
  await tx.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      href: input.href ?? null,
    },
  });
}
