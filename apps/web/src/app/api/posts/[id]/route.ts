import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializePost } from '@/lib/serializers';
import { json, notFound, unauthorized } from '@/lib/api';
import { canModerate } from '@/lib/moderators';

const POST_INCLUDE = {
  author: true,
  community: { include: { _count: { select: { subscriptions: true, posts: true } } } },
  games: { include: { game: true } },
  media: true,
  _count: { select: { comments: true } },
} as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id },
    include: POST_INCLUDE,
  });
  if (!post) return notFound('Post not found');

  // non-mods only see VISIBLE posts
  if (post.status !== 'VISIBLE' && !session?.user) return notFound();
  if (post.status !== 'VISIBLE' && session?.user && !(await canModerate(session, post.community.slug))) {
    return notFound();
  }

  let vote: 1 | -1 | 0 = 0;
  if (session?.user?.id) {
    const v = await prisma.vote.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    });
    if (v) vote = v.value as 1 | -1;
  }

  return json(serializePost({ ...post, vote }));
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return notFound('Post not found');

  const isAuthor = post.authorId === session.user.id;
  const isMod = await canModerate(session, (await prisma.community.findUnique({ where: { id: post.communityId } }))!.slug);

  if (!isAuthor && !isMod) return json({ error: 'Forbidden' }, { status: 403 });

  await prisma.post.delete({ where: { id } });

  // release storage
  const assets = await prisma.mediaAsset.findMany({ where: { postId: id } });
  const freed = assets.reduce((s, a) => s + Number(a.sizeBytes), 0);
  if (freed > 0) {
    await prisma.user.update({
      where: { id: post.authorId },
      data: { storageUsedBytes: { decrement: freed }, karma: { decrement: 1 } },
    });
  }

  return json({ ok: true });
}
