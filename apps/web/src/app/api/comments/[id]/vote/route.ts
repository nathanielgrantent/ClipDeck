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

  const rl = await rateLimit(`rl:vote:comment:${session.user.id}`, 60_000, 60);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const value = parsed.data.value;

  const comment = await prisma.comment.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!comment) return badRequest('Comment not found');
  if (comment.authorId === session.user.id) return badRequest('You cannot vote on your own comment');

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.vote.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId: id } },
    });
    const prev = existing?.value ?? 0;

    if (value === 0) {
      if (existing) await tx.vote.delete({ where: { id: existing.id } });
      const delta = prev === 1 ? -1 : prev === -1 ? 1 : 0;
      if (delta !== 0) {
        return tx.comment.update({ where: { id }, data: { score: { increment: delta } } });
      }
      return tx.comment.findUniqueOrThrow({ where: { id }, select: { score: true } });
    }

    if (existing) {
      if (existing.value === value) {
        return tx.comment.findUniqueOrThrow({ where: { id }, select: { score: true } });
      }
      await tx.vote.update({ where: { id: existing.id }, data: { value } });
      return tx.comment.update({ where: { id }, data: { score: { increment: value - prev } } });
    }

    await tx.vote.create({ data: { userId: session.user.id, commentId: id, value } });
    return tx.comment.update({ where: { id }, data: { score: { increment: value } } });
  });

  return json({ score: updated.score, vote: value }, { headers: rateLimitHeaders(rl) });
}
