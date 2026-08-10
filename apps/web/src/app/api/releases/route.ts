import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/api';

export async function GET() {
  const releases = await prisma.desktopRelease.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      version: true,
      platform: true,
      url: true,
      signature: true,
      notes: true,
      publishedAt: true,
    },
  });

  return cachedJson(
    releases.map((r) => ({
      version: r.version,
      platform: r.platform,
      url: r.url,
      signature: r.signature,
      notes: r.notes,
      publishedAt: r.publishedAt.toISOString(),
    })),
    300,
  );
}
