import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, badRequest, unauthorized } from '@/lib/api';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { value?: number };
  const value = body.value;
  if (value !== 1 && value !== -1 && value !== 0) return badRequest('Invalid vote value');

  const comment = await prisma.comment.findUnique({ where: { id } });
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
      return tx.comment.update({ where: { id }, data: { score: { increment: delta } } });
    }

    if (existing) {
      await tx.vote.update({ where: { id: existing.id }, data: { value } });
      return tx.comment.update({ where: { id }, data: { score: { increment: value - prev } } });
    }

    await tx.vote.create({ data: { userId: session.user.id, commentId: id, value } });
    return tx.comment.update({ where: { id }, data: { score: { increment: value } } });
  });

  return json({ score: updated.score, vote: value });
}
