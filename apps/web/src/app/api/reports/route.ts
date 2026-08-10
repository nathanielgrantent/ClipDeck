import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, badRequest, readJson, unauthorized } from '@/lib/api';
import { reportSchema } from '@/lib/validation';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:report:${session.user.id}`, 60_000, 5);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const { targetType, targetId, reason } = parsed.data;

  // resolve which community the target belongs to so mods see it
  let communityId: string | null = null;
  let postId: string | null = null;
  let commentId: string | null = null;

  if (targetType === 'POST') {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) return badRequest('Post not found');
    communityId = post.communityId;
    postId = post.id;
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!comment) return badRequest('Comment not found');
    const post = await prisma.post.findUnique({ where: { id: comment.postId } });
    communityId = post?.communityId ?? null;
    commentId = comment.id;
    postId = comment.postId;
  }

  const existing = await prisma.report.findFirst({
    where: { reporterId: session.user.id, targetId },
  });
  if (existing) return badRequest('You have already reported this content');

  const report = await prisma.report.create({
    data: {
      targetType,
      targetId,
      postId,
      commentId,
      communityId,
      reporterId: session.user.id,
      reason,
    },
  });

  return json({ id: report.id, ok: true }, { status: 201, headers: rateLimitHeaders(rl) });
}
