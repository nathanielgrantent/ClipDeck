import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { forbidden, json, notFound, unauthorized } from '@/lib/api';
import { canModerate, isSiteAdmin } from '@/lib/moderators';
import { serializeUser } from '@/lib/serializers';
import type { PublicUser, Report } from '@gamingclips/shared';

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

  const rows = await prisma.report.findMany({
    where: {
      ...(community ? { communityId: community.id } : {}),
      status: 'OPEN',
    },
    include: { reporter: true, handledBy: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const dto: Report[] = rows.map((r) => ({
    id: r.id,
    targetType: r.targetType as Report['targetType'],
    targetId: r.targetId,
    reporter: serializeUser(r.reporter) as PublicUser,
    reason: r.reason,
    status: r.status as Report['status'],
    createdAt: r.createdAt.toISOString(),
    handledBy: r.handledBy ? (serializeUser(r.handledBy) as PublicUser) : null,
  }));

  return json(dto);
}
