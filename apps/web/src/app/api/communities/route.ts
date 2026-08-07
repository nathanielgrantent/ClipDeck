import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/serializers';
import { json, badRequest, readJson, serverError } from '@/lib/api';
import { createCommunitySchema } from '@/lib/validation';
import { isCommunityModerator, isSiteAdmin } from '@/lib/moderators';
import { slugify, serializeStringArray } from '@gamingclips/shared';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') ?? 'members';
  const search = url.searchParams.get('q')?.trim() ?? '';

  const session = await auth();
  const userId = session?.user?.id;

  const communities = await prisma.community.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : undefined,
    include: { _count: { select: { subscriptions: true, posts: true } } },
    take: 60,
    orderBy:
      sort === 'members'
        ? { subscriptions: { _count: 'desc' } }
        : sort === 'new'
          ? { createdAt: 'desc' }
          : { name: 'asc' },
  });

  if (userId) {
    const subs = await prisma.subscription.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const subSet = new Set(subs.map((s) => s.communityId));
    for (const c of communities) {
      (c as { subscribed?: boolean }).subscribed = subSet.has(c.id);
      (c as { isModerator?: boolean }).isModerator = await isCommunityModerator(userId, c.slug);
    }
  }

  return json(communities.map(serializeCommunity));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return json({ error: 'Unauthorized' }, { status: 401 });

  const body = await readJson<{ name?: string; slug?: string; description?: string; rules?: string[] }>(req);
  if (!body) return badRequest();

  const parsed = createCommunitySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const existing = await prisma.community.findUnique({ where: { slug } });
  if (existing) return json({ error: 'That community slug is already taken.' }, { status: 409 });

  try {
    const community = await prisma.community.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        rules: serializeStringArray(parsed.data.rules),
        ownerId: session.user.id,
      },
      include: { _count: { select: { subscriptions: true, posts: true } } },
    });
    // owner auto-subscribes
    await prisma.subscription.create({
      data: { userId: session.user.id, communityId: community.id },
    });
    return json(serializeCommunity(community), { status: 201 });
  } catch (err) {
    console.error('[communities:create]', err);
    return serverError();
  }
}
