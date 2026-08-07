import { prisma } from '@/lib/prisma';
import { json } from '@/lib/api';

export async function GET() {
  const releases = await prisma.desktopRelease.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return json(
    releases.map((r) => ({
      version: r.version,
      platform: r.platform,
      url: r.url,
      signature: r.signature,
      notes: r.notes,
      publishedAt: r.publishedAt.toISOString(),
    })),
  );
}
