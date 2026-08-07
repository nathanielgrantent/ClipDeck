import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export async function isSiteAdmin(userId: string | undefined) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === 'ADMIN';
}

export async function isCommunityModerator(userId: string, communitySlug: string) {
  const community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    select: {
      ownerId: true,
      moderators: { where: { id: userId }, select: { id: true } },
    },
  });
  if (!community) return false;
  return community.ownerId === userId || community.moderators.length > 0;
}

/** True if the session user can moderate the given community. */
export async function canModerate(session: Session | null, communitySlug: string) {
  if (!session?.user) return false;
  if (await isSiteAdmin(session.user.id)) return true;
  return isCommunityModerator(session.user.id, communitySlug);
}

export async function isBanned(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
  return Boolean(user?.banned);
}
