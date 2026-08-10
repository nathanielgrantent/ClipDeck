import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/serializers';

export const revalidate = 60;

export async function TopCommunities() {
  const communities = await prisma.community.findMany({
    include: { _count: { select: { subscriptions: true, posts: true } } },
    orderBy: { subscriptions: { _count: 'desc' } },
    take: 8,
  });

  return (
    <div className="rounded-btn border border-white/5 bg-card p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Top communities</h3>
      <div className="space-y-1">
        {communities.map((c) => {
          const dto = serializeCommunity(c);
          return (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="flex items-center gap-2 rounded-btn px-2 py-1.5 transition-colors hover:bg-sidebar-hover"
            >
              {c.avatarUrl ? (
                <img src={c.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">{c.name}</div>
                <div className="text-[11px] text-text-muted">
                  {dto.memberCount.toLocaleString()} members
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
