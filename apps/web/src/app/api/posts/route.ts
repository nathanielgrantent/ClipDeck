import type { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializePost } from '@/lib/serializers';
import { json, badRequest, readJson, serverError, unauthorized } from '@/lib/api';
import { createPostSchema } from '@/lib/validation';
import { buildContentContext, evaluateRules } from '@/lib/automod';
import { applyVerdict, loadRules } from '@/lib/moderation';
import { isBanned } from '@/lib/moderators';
import type { Platform } from '@gamingclips/shared';

export const POST_INCLUDE = {
  author: true,
  community: { include: { _count: { select: { subscriptions: true, posts: true } } } },
  games: { include: { game: true } },
  media: true,
  _count: { select: { comments: true } },
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const communitySlug = url.searchParams.get('community');
  const sort = url.searchParams.get('sort') ?? 'hot';
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
  const cursor = url.searchParams.get('cursor');
  const session = await auth();

  const where: Prisma.PostWhereInput = { status: 'VISIBLE' };
  if (communitySlug) {
    const community = await prisma.community.findUnique({ where: { slug: communitySlug } });
    if (!community) return json({ posts: [], nextCursor: null });
    where.communityId = community.id;
  }

  const orderBy: Prisma.PostOrderByWithRelationInput[] =
    sort === 'new'
      ? [{ createdAt: 'desc' }]
      : sort === 'top'
        ? [{ score: 'desc' }, { createdAt: 'desc' }]
        : [{ score: 'desc' }, { createdAt: 'desc' }];

  const posts = await prisma.post.findMany({
    where,
    include: POST_INCLUDE,
    orderBy,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  let nextCursor: string | null = null;
  const page = posts.length > limit ? posts.slice(0, -1) : posts;
  if (posts.length > limit) nextCursor = page[page.length - 1].id;

  let voteMap = new Map<string, 1 | -1>();
  if (session?.user?.id) {
    const votes = await prisma.vote.findMany({
      where: { userId: session.user.id, postId: { in: page.map((p) => p.id) } },
    });
    for (const v of votes) {
      if (v.postId) voteMap.set(v.postId, v.value as 1 | -1);
    }
  }

  return json({
    posts: page.map((p) => serializePost({ ...p, vote: voteMap.get(p.id) ?? 0 })),
    nextCursor,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  if (await isBanned(session.user.id)) {
    return json({ error: 'Your account is banned.' }, { status: 403 });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const community = await prisma.community.findUnique({
    where: { slug: parsed.data.communitySlug },
  });
  if (!community) return badRequest('Community not found');

  const asset = await prisma.mediaAsset.findUnique({ where: { id: parsed.data.assetId } });
  if (!asset || asset.userId !== session.user.id) {
    return badRequest('Media asset not found or not owned by you');
  }
  if (asset.status === 'FAILED') return badRequest('Media failed to process; please re-upload');

  const gameIds = parsed.data.gameIds;
  const games = gameIds.length
    ? await prisma.game.findMany({ where: { id: { in: gameIds } } })
    : [];

  const [author, rules] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    loadRules(community.slug),
  ]);
  if (!author) return unauthorized();

  const ctx = buildContentContext({
    title: parsed.data.title,
    body: parsed.data.body,
    type: parsed.data.type,
    mediaPresent: true,
    mediaType: asset.type as 'VIDEO' | 'IMAGE',
    gameNames: games.map((g) => g.name),
    platforms: games.map((g) => g.platform as Platform),
    authorAgeDays: Math.max(0, (Date.now() - author.createdAt.getTime()) / 86400000),
    authorKarma: author.karma,
    authorNewUser: author.role === 'USER' && author.karma < 1,
    authorBanned: author.banned,
    authorRole: author.role as 'USER' | 'MOD' | 'ADMIN',
  });
  const verdict = evaluateRules(rules, ctx);

  try {
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title: parsed.data.title,
          body: parsed.data.body || null,
          type: parsed.data.type,
          authorId: session.user.id,
          communityId: community.id,
          games: { create: games.map((g) => ({ gameId: g.id })) },
          media: { connect: { id: asset.id } },
        },
        include: POST_INCLUDE,
      });

      if (verdict.action !== 'ALLOW') {
        await applyVerdict(tx, {
          targetType: 'POST',
          targetId: created.id,
          verdict,
          reasons: verdict.reasons,
        });
        await tx.user.update({ where: { id: author.id }, data: { karma: { decrement: 1 } } });
      } else {
        await tx.user.update({ where: { id: author.id }, data: { karma: { increment: 1 } } });
      }

      if (verdict.action === 'REMOVE') {
        await tx.mediaAsset.update({
          where: { id: asset.id },
          data: { status: 'FAILED' },
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: created.id },
        include: POST_INCLUDE,
      });
    });

    return json(serializePost(post), { status: 201 });
  } catch (err) {
    console.error('[posts:create]', err);
    return serverError();
  }
}
