import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, badRequest, readJson, unauthorized } from '@/lib/api';
import { voteSchema } from '@/lib/validation';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:vote:post:${session.user.id}`, 60_000, 60);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const value = parsed.data.value;

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) return badRequest('Post not found');
  if (post.authorId === session.user.id) return badRequest('You cannot vote on your own post');

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    });
    const prev = existing?.value ?? 0;

    if (value === 0) {
      if (existing) await tx.vote.delete({ where: { id: existing.id } });
      const delta = prev === 1 ? -1 : prev === -1 ? 1 : 0;
      if (delta !== 0) {
        return tx.post.update({ where: { id }, data: { score: { increment: delta } } });
      }
      return tx.post.findUniqueOrThrow({ where: { id }, select: { score: true } });
    }

    if (existing) {
      if (existing.value === value) {
        return tx.post.findUniqueOrThrow({ where: { id }, select: { score: true } });
      }
      await tx.vote.update({ where: { id: existing.id }, data: { value } });
      const delta = value - prev;
      return tx.post.update({ where: { id }, data: { score: { increment: delta } } });
    }

    await tx.vote.create({ data: { userId: session.user.id, postId: id, value } });
    return tx.post.update({ where: { id }, data: { score: { increment: value } } });
  });

  return json({ score: updated.score, vote: value }, { headers: rateLimitHeaders(rl) });
}
