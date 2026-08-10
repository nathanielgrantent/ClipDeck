import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, badRequest, readJson, unauthorized, forbidden } from '@/lib/api';
import { modActionSchema } from '@/lib/validation';
import { canModerate, isSiteAdmin } from '@/lib/moderators';
import { logAction, notifyUser } from '@/lib/moderation';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:mod:action:${session.user.id}`, 60_000, 30);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = modActionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const { targetType, targetId, action, reason } = parsed.data;

  // resolve community + owner id for permission check
  let communitySlug: string | null = null;
  let ownerId: string | null = null;
  let title = '';
  let href: string | null = null;

  if (targetType === 'POST') {
    const post = await prisma.post.findUnique({ where: { id: targetId }, include: { community: true } });
    if (!post) return badRequest('Post not found');
    communitySlug = post.community.slug;
    ownerId = post.authorId;
    title = post.title;
    href = `/p/${post.id}`;
  } else if (targetType === 'COMMENT') {
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      include: { post: { include: { community: true } } },
    });
    if (!comment) return badRequest('Comment not found');
    communitySlug = comment.post.community.slug;
    ownerId = comment.authorId;
    title = comment.body.slice(0, 80);
    href = `/p/${comment.postId}`;
  } else {
    // USER target: requires site admin
    if (!(await isSiteAdmin(session.user.id))) return forbidden();
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) return badRequest('User not found');
    ownerId = user.id;
    title = user.username;
    href = null;
  }

  if (communitySlug && !(await canModerate(session, communitySlug))) {
    return forbidden();
  }

  const result = await prisma.$transaction(async (tx) => {
    // clear pending mod queue entries for this target
    if (action === 'APPROVE' || action === 'REMOVE') {
      const queueItems = await tx.modQueueItem.findMany({
        where: targetType === 'POST' ? { postId: targetId } : { commentId: targetId },
      });
      for (const item of queueItems) {
        await tx.modQueueItem.update({
          where: { id: item.id },
          data: {
            status: action === 'APPROVE' ? 'APPROVED' : 'REMOVED',
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        });
      }
      if (action === 'APPROVE') {
        const data = { status: 'VISIBLE' as const, automodReasons: '[]' };
        if (targetType === 'POST') await tx.post.update({ where: { id: targetId }, data });
        else await tx.comment.update({ where: { id: targetId }, data });
      } else {
        const data = { status: 'REMOVED' as const };
        if (targetType === 'POST') await tx.post.update({ where: { id: targetId }, data });
        else await tx.comment.update({ where: { id: targetId }, data });
      }
    }

    if (action === 'BAN') {
      await tx.user.update({ where: { id: targetId }, data: { banned: true } });
    } else if (action === 'UNBAN') {
      await tx.user.update({ where: { id: targetId }, data: { banned: false } });
    }

    await logAction(tx, {
      action,
      actorId: session.user.id,
      targetType,
      targetId,
      reason,
    });

    if (action === 'REMOVE' || action === 'BAN' || action === 'WARN' || action === 'NOTIFY') {
      if (ownerId) {
        await notifyUser(tx, {
          userId: ownerId,
          type: 'MOD_ACTION',
          title: `Content removed: ${title.slice(0, 60)}`,
          body: reason || 'A moderator action was applied to your content.',
          href: href ?? undefined,
        });
      }
    }

    return { ok: true };
  });

  return json(result);
}
