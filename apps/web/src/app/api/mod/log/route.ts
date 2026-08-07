import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { forbidden, json, notFound, unauthorized } from '@/lib/api';
import { canModerate, isSiteAdmin } from '@/lib/moderators';
import { serializeUser } from '@/lib/serializers';
import type { ModLogEntry, PublicUser } from '@gamingclips/shared';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const communitySlug = url.searchParams.get('community');

  if (communitySlug && !(await canModerate(session, communitySlug))) {
    return forbidden();
  }
  if (!communitySlug && !(await isSiteAdmin(session.user.id))) {
    return forbidden();
  }

  const community = communitySlug
    ? await prisma.community.findUnique({ where: { slug: communitySlug } })
    : null;
  if (communitySlug && !community) return notFound('Community not found');

  const rows = await prisma.modLog.findMany({
    where: community
      ? {
          OR: [
            { post: { communityId: community.id } },
            { comment: { post: { communityId: community.id } } },
          ],
        }
      : undefined,
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const dto: ModLogEntry[] = rows.map((row) => ({
    id: row.id,
    action: row.action as ModLogEntry['action'],
    actor: serializeUser(row.actor) as PublicUser,
    targetType: row.targetType as ModLogEntry['targetType'],
    targetId: row.targetId,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  }));

  return json(dto);
}
