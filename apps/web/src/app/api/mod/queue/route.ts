import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializePost, serializeComment } from '@/lib/serializers';
import { json, unauthorized } from '@/lib/api';
import { canModerate } from '@/lib/moderators';
import { parseStringArray } from '@gamingclips/shared';

export const POST_INCLUDE = {
  author: true,
  community: { include: { _count: { select: { subscriptions: true, posts: true } } } },
  games: { include: { game: true } },
  media: true,
  _count: { select: { comments: true } },
} as const;

const COMMENT_INCLUDE = { author: true, _count: { select: { children: true } }, post: true } as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const communitySlug = url.searchParams.get('community');
  const kind = url.searchParams.get('kind'); // POST | COMMENT

  if (communitySlug && !(await canModerate(session, communitySlug))) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!communitySlug) {
    // global queue: site admins only
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== 'ADMIN') return json({ error: 'Forbidden' }, { status: 403 });
  }

  const where: Record<string, unknown> = { status: 'PENDING' };
  if (kind) where.kind = kind;

  const items = await prisma.modQueueItem.findMany({
    where,
    include: {
      post: { include: POST_INCLUDE },
      comment: { include: COMMENT_INCLUDE },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  const targets = await Promise.all(
    items.map(async (item) => {
      const communityId = item.post?.communityId ?? item.comment?.post?.communityId;
      let community = null;
      if (communityId) {
        community = await prisma.community.findUnique({ where: { id: communityId } });
      }
      return {
        id: item.id,
        kind: item.kind,
        rules: parseStringArray(item.rules),
        categories: parseStringArray(item.categories),
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        community: community ? { slug: community.slug, name: community.name } : null,
        target: item.kind === 'POST' && item.post ? serializePost(item.post) : item.comment ? serializeComment(item.comment) : null,
      };
    }),
  );

  return json(targets);
}
