import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, notFound, unauthorized } from '@/lib/api';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { slug } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return notFound('Community not found');

  const existing = await prisma.subscription.findUnique({
    where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
    select: { userId: true },
  });

  if (existing) {
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id, communityId: community.id },
    });
  } else {
    await prisma.subscription.create({
      data: { userId: session.user.id, communityId: community.id },
    });
  }

  return json({ ok: true, subscribed: !existing });
}
