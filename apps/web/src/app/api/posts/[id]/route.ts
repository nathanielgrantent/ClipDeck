import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { POST_INCLUDE } from '@/lib/prisma-constants';
import { serializePost } from '@/lib/serializers';
import { json, notFound, unauthorized, forbidden } from '@/lib/api';
import { canModerate } from '@/lib/moderators';

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
  const community = await prisma.community.findUnique({ where: { id: post.communityId } });
  if (!community) return notFound('Community not found');
  const isMod = await canModerate(session, community.slug);

  if (!isAuthor && !isMod) return forbidden();

  // Query assets BEFORE deleting the post (onDelete: SetNull clears postId)
  const assets = await prisma.mediaAsset.findMany({ where: { postId: id } });
  const freed = assets.reduce((s, a) => s + Number(a.sizeBytes), 0);

  await prisma.post.delete({ where: { id } });

  // release storage
  if (freed > 0) {
    await prisma.user.update({
      where: { id: post.authorId },
      data: { storageUsedBytes: { decrement: freed }, karma: { decrement: 1 } },
    });
  }

  return json({ ok: true });
}
