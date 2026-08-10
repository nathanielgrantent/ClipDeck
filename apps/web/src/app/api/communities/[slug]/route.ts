import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/serializers';
import { json, notFound, unauthorized, readJson, badRequest, forbidden } from '@/lib/api';
import { isCommunityModerator } from '@/lib/moderators';

async function getCommunity(slug: string, userId?: string) {
  const community = await prisma.community.findUnique({
    where: { slug },
    include: { _count: { select: { subscriptions: true, posts: true } } },
  });
  if (!community) return null;

  if (userId) {
    const sub = await prisma.subscription.findUnique({
      where: { userId_communityId: { userId, communityId: community.id } },
      select: { userId: true },
    });
    (community as { subscribed?: boolean }).subscribed = Boolean(sub);
    (community as { isModerator?: boolean }).isModerator = await isCommunityModerator(userId, slug);
  }
  return community;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const community = await getCommunity(slug, session?.user?.id);
  if (!community) return notFound();
  return json(serializeCommunity(community));
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const community = await getCommunity(slug, session.user.id);
  if (!community) return notFound();

  const body = await readJson<{ action?: string }>(req);
  if (!body) return badRequest('Invalid JSON body');

  const { action } = body;

  if (action === 'subscribe') {
    await prisma.subscription.upsert({
      where: { userId_communityId: { userId: session.user.id, communityId: community.id } },
      update: {},
      create: { userId: session.user.id, communityId: community.id },
    });
  } else if (action === 'unsubscribe') {
    await prisma.subscription.deleteMany({
      where: { userId: session.user.id, communityId: community.id },
    });
  } else {
    return json({ error: 'Unknown action' }, { status: 400 });
  }

  return json(serializeCommunity((await getCommunity(slug, session.user.id))!));
}
