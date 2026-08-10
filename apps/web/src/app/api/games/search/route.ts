import { prisma } from '@/lib/prisma';
import { serializeGame } from '@/lib/serializers';
import { cachedJson, json } from '@/lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const platform = url.searchParams.get('platform') ?? '';

  if (q.length < 2) return json([]);

  const ql = q.toLowerCase().slice(0, 100);
  const tokens = ql.split(/\s+/).filter(Boolean);

  const games = await prisma.game.findMany({
    where: {
      AND: [
        platform ? { platform } : {},
        {
          OR: [
            { normalizedName: { contains: ql } },
            { name: { contains: ql } },
            ...tokens.slice(0, 3).map((t) => ({ aliases: { contains: t } })),
          ],
        },
      ],
    },
    orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
    take: 12,
  });

  return cachedJson(games.map(serializeGame), 60);
}
