import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, json, notFound, readJson, serverError, unauthorized } from '@/lib/api';
import { canModerate } from '@/lib/moderators';
import { logAction, notifyUser } from '@/lib/moderation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await readJson<{ action?: string }>(req);
  if (!body) return badRequest();

  const action = body.action;
  if (action !== 'approve' && action !== 'remove') return badRequest('Invalid action');

  const item = await prisma.modQueueItem.findUnique({
    where: { id },
    include: {
      post: { include: { community: true, author: { select: { id: true } } } },
      comment: { include: { post: { include: { community: true, author: { select: { id: true } } } }, author: { select: { id: true } } } },
    },
  });
  if (!item) return notFound('Queue item not found');
  if (item.status !== 'PENDING') return badRequest('Queue item already resolved');

  const communitySlug = item.post?.community.slug ?? item.comment?.post.community.slug ?? '';
  if (!(await canModerate(session, communitySlug))) return forbidden();

  const targetType: 'POST' | 'COMMENT' = item.kind === 'POST' ? 'POST' : 'COMMENT';
  const targetId = item.post?.id ?? item.comment?.id ?? '';
  if (!targetId) return badRequest('Target not found');
  const ownerId = item.post?.author.id ?? item.comment?.author.id ?? null;
  const title = item.post?.title ?? item.comment?.body.slice(0, 80) ?? '';

  const approved = action === 'approve';
  try {
    await prisma.$transaction(async (tx) => {
      await tx.modQueueItem.update({
        where: { id: item.id },
        data: {
          status: approved ? 'APPROVED' : 'REMOVED',
          reviewedById: session.user.id,
          reviewedAt: new Date(),
        },
      });

      const data = approved
        ? { status: 'VISIBLE' as const, automodReasons: '[]' }
        : { status: 'REMOVED' as const };
      if (targetType === 'POST') {
        await tx.post.update({ where: { id: targetId }, data });
      } else {
        await tx.comment.update({ where: { id: targetId }, data });
      }

      await logAction(tx, {
        action: approved ? 'APPROVE' : 'REMOVE',
        actorId: session.user.id,
        targetType,
        targetId,
        reason: 'Reviewed in moderation queue',
      });

      if (!approved && ownerId) {
        await notifyUser(tx, {
          userId: ownerId,
          type: 'MOD_ACTION',
          title: `Content removed: ${title.slice(0, 60)}`,
          body: 'A moderator removed your content from the community.',
        });
      }
    });
  } catch (err) {
    console.error('[mod:queue:review]', err);
    return serverError();
  }

  return json({ ok: true });
}
