import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/serializers';
import { cachedJson, json, badRequest, readJson, serverError, unauthorized } from '@/lib/api';
import { createCommunitySchema } from '@/lib/validation';
import { slugify, serializeStringArray } from '@gamingclips/shared';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') ?? 'members';
  const search = url.searchParams.get('q')?.trim().slice(0, 100) ?? '';

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

    const modCommunities = await prisma.community.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { moderators: { some: { id: userId } } },
        ],
      },
      select: { id: true },
    });
    const modSet = new Set(modCommunities.map((c) => c.id));

    for (const c of communities) {
      (c as { subscribed?: boolean }).subscribed = subSet.has(c.id);
      (c as { isModerator?: boolean }).isModerator = modSet.has(c.id);
    }
  }

  return cachedJson(communities.map(serializeCommunity), 30);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:community:create:${session.user.id}`, 300_000, 3);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<{ name?: string; slug?: string; description?: string; rules?: string[] }>(req);
  if (!body) return badRequest();

  const parsed = createCommunitySchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const slug = parsed.data.slug || slugify(parsed.data.name);

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
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      return json({ error: 'That community slug is already taken.' }, { status: 409 });
    }
    console.error('[communities:create]', err);
    return serverError();
  }
}
