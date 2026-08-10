import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { COMMENT_INCLUDE } from '@/lib/prisma-constants';
import { serializeComment } from '@/lib/serializers';
import { json, badRequest, readJson, unauthorized } from '@/lib/api';
import { createCommentSchema } from '@/lib/validation';
import { buildContentContext, evaluateRules } from '@/lib/automod';
import { applyVerdict, loadRules, notifyUser } from '@/lib/moderation';
import { isBanned } from '@/lib/moderators';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

type CommentRecord = Awaited<ReturnType<typeof prisma.comment.findMany>>[number];
type CommentTreeNode = CommentRecord & { children: CommentTreeNode[] };

function buildTree(comments: CommentRecord[]): CommentTreeNode[] {
  const map = new Map<string, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];
  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const postId = url.searchParams.get('postId');
  if (!postId) return badRequest('Missing postId');
  const session = await auth();

  const comments = await prisma.comment.findMany({
    where: { postId, status: { not: 'REMOVED' } },
    include: COMMENT_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });

  let voteMap = new Map<string, 1 | -1>();
  if (session?.user?.id) {
    const votes = await prisma.vote.findMany({
      where: { userId: session.user.id, commentId: { in: comments.map((c) => c.id) } },
      select: { commentId: true, value: true },
    });
    for (const v of votes) voteMap.set(v.commentId!, v.value as 1 | -1);
  }

  const tree = buildTree(comments).map((n) =>
    serializeComment({ ...n, vote: voteMap.get(n.id) ?? 0 } as import('@/lib/serializers').CommentNode),
  );

  return json(tree);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  if (await isBanned(session.user.id)) {
    return json({ error: 'Your account is banned.' }, { status: 403 });
  }

  const rl = await rateLimit(`rl:comment:create:${session.user.id}`, 60_000, 20);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const post = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    include: { community: true },
  });
  if (!post) return badRequest('Post not found');
  if (post.status !== 'VISIBLE') return badRequest('Post is not visible');

  let parentAuthorId: string | null = null;
  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.postId !== post.id) return badRequest('Parent comment not found');
    parentAuthorId = parent.authorId;
  }

  const [author, rules] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    loadRules(post.community.slug),
  ]);
  if (!author) return unauthorized();

  const ctx = buildContentContext({
    title: '',
    body: parsed.data.body,
    type: 'COMMENT',
    authorAgeDays: Math.max(0, (Date.now() - author.createdAt.getTime()) / 86400000),
    authorKarma: author.karma,
    authorNewUser: author.role === 'USER' && author.karma < 1,
    authorBanned: author.banned,
    authorRole: author.role as 'USER' | 'MOD' | 'ADMIN',
  });
  const verdict = evaluateRules(rules, ctx);

  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: {
        postId: post.id,
        parentId: parsed.data.parentId ?? null,
        body: parsed.data.body,
        authorId: session.user.id,
      },
      include: COMMENT_INCLUDE,
    });

    if (verdict.action !== 'ALLOW') {
      await applyVerdict(tx, {
        targetType: 'COMMENT',
        targetId: created.id,
        verdict,
        reasons: verdict.reasons,
      });
    }

    if (parentAuthorId && parentAuthorId !== session.user.id) {
      await notifyUser(tx, {
        userId: parentAuthorId,
        type: 'REPLY',
        title: `${author.username} replied to your comment`,
        body: parsed.data.body.slice(0, 160),
        href: `/p/${post.id}`,
      });
    }

    return created;
  });

  return json(serializeComment({ ...comment, vote: 0 }), { status: 201 });
}
