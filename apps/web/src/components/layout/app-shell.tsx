'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCommunities, useMe } from '@/hooks';
import { cn, initials, slugify } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

// ---------------------------------------------------------------------------
// Left icon rail (Discord-style server bar)
// ---------------------------------------------------------------------------

export const ServerRail = memo(function ServerRail({
  activeSlug,
  communities,
}: {
  activeSlug?: string;
  communities: ReturnType<typeof useCommunities>['communities'];
}) {
  const { status } = useSession();

  const railItems = useMemo(() => [
    { key: 'home', label: 'Home', href: '/', icon: <HomeIcon /> },
    ...communities.slice(0, 40).map((c) => ({
      key: c.slug,
      label: c.name,
      href: `/c/${c.slug}`,
      icon: c.avatarUrl ? (
        <img src={c.avatarUrl} alt="" className="h-full w-full rounded-[16px] object-cover" loading="lazy" decoding="async" />
      ) : (
        <span className="text-sm font-semibold">{initials(c.name)}</span>
      ),
    })),
  ], [communities]);

  return (
    <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-rail py-3" aria-label="Communities">
      {status === 'authenticated' && (
        <Link
          href="/upload"
          title="Upload a clip (Ctrl+U)"
          aria-label="Upload a clip"
          className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-accent text-xl font-semibold text-white transition-all hover:rounded-2xl hover:bg-accent-hover"
        >
          +
        </Link>
      )}

      <div className="my-1 h-0.5 w-8 rounded bg-white/10" />

      {railItems.map((item) => {
        const active = item.key === activeSlug;
        return (
          <div key={item.key} className="group relative flex w-full justify-center">
            <span
              className={cn(
                'absolute -left-1.5 top-1/2 -translate-y-1/2 rounded-r bg-white transition-all',
                active ? 'h-6 w-1 opacity-100' : 'h-0 w-0 opacity-0 group-hover:h-4 group-hover:w-1 group-hover:opacity-100',
              )}
            />
            <Link
              href={item.href}
              title={item.label}
              className={cn(
                'flex h-12 w-12 items-center justify-center overflow-hidden text-text-primary transition-all',
                active ? 'rounded-[16px] bg-sidebar-active' : 'rounded-[24px] bg-sidebar hover:rounded-[16px] hover:bg-accent',
              )}
            >
              {item.icon}
            </Link>
          </div>
        );
      })}

      <Link
        href="/c/create"
        title="Create community"
        className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-sidebar text-2xl font-light text-green-500 transition-all hover:rounded-[16px] hover:bg-green-600 hover:text-white"
      >
        +
      </Link>
    </nav>
  );
});

function HomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Community sidebar
// ---------------------------------------------------------------------------

export const Sidebar = memo(function Sidebar({
  activeSlug,
  communities,
}: {
  activeSlug?: string;
  communities: ReturnType<typeof useCommunities>['communities'];
}) {
  const pathname = usePathname();

  const browseItems = [
    { label: 'Home', href: '/', active: pathname === '/' },
    { label: 'Upload', href: '/upload', active: pathname === '/upload' },
    { label: 'Downloads', href: '/download', active: pathname === '/download' },
  ];

  const modSlugs = useMemo(() => communities.filter((c) => c.isModerator).map((c) => c.slug), [communities]);

  return (
    <aside className="flex w-[240px] shrink-0 flex-col bg-sidebar" aria-label="Navigation sidebar">
      <div className="flex h-12 items-center justify-between border-b border-black/20 px-4 shadow-sm">
        <span className="text-sm font-semibold text-white">ClipDeck</span>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="mb-3">
          <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted" id="browse-label">Browse</div>
          <nav aria-labelledby="browse-label">
            {browseItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'mx-2 flex items-center gap-2 rounded-btn px-2 py-1.5 text-sm transition-colors',
                  item.active ? 'bg-sidebar-active text-white' : 'text-text-secondary hover:bg-sidebar-hover hover:text-white',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mb-3">
          <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted" id="communities-label">Communities</div>
          <nav aria-labelledby="communities-label">
          {communities.slice(0, 30).map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className={cn(
                'mx-2 flex items-center gap-2 rounded-btn px-2 py-1.5 text-sm transition-colors',
                (activeSlug ?? pathname.split('/')[2]) === c.slug
                  ? 'bg-sidebar-active text-white'
                  : 'text-text-secondary hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Avatar src={c.avatarUrl} name={c.name} size={20} />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
          <Link href="/c/create" className="mx-2 flex items-center gap-2 rounded-btn px-2 py-1.5 text-sm text-green-500 hover:bg-sidebar-hover">
            <span className="text-base leading-none">+</span> Create community
          </Link>
          </nav>
        </div>

        {modSlugs.length > 0 && (
          <div>
            <div className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted" id="mod-label">Moderation</div>
            <nav aria-labelledby="mod-label">
            {modSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/c/${slug}/mod`}
                className="mx-2 flex items-center gap-2 rounded-btn px-2 py-1.5 text-sm text-amber-400/90 transition-colors hover:bg-sidebar-hover"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V4l8-3z" />
                </svg>
                {slugify(slug)}
              </Link>
            ))}
            </nav>
          </div>
        )}
      </div>

      <UserChip />
    </aside>
  );
});

const UserChip = memo(function UserChip() {
  const { me } = useMe();
  const { status } = useSession();

  return (
    <div className="flex items-center gap-2 bg-content px-2 py-1.5">
      {status === 'authenticated' && me ? (
        <>
          <Avatar src={me.avatarUrl} name={me.username} size={32} status="online" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{me.username}</div>
            <div className="text-[11px] text-green-400">Online</div>
          </div>
          <Link href="/settings" className="rounded p-1 text-text-muted hover:bg-sidebar-hover hover:text-text-primary" title="Settings" aria-label="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </Link>
          <Link href="/settings/accessibility" className="rounded p-1 text-text-muted hover:bg-sidebar-hover hover:text-text-primary" title="Accessibility Settings" aria-label="Accessibility Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="4.5" r="2.5" />
              <path d="M12 7v5m0 0l-3 5m3-5l3 5M6 12h12" />
            </svg>
          </Link>
        </>
      ) : (
        <>
          <Avatar name="Guest" size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">Guest</div>
            <div className="text-[11px] text-text-muted">Not signed in</div>
          </div>
          <Link href="/login" className="rounded-btn bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-hover">
            Sign in
          </Link>
        </>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// App shell wrapper
// ---------------------------------------------------------------------------

export function AppShell({
  children,
  activeSlug,
  showSidebar = true,
  rightPane,
}: {
  children: React.ReactNode;
  activeSlug?: string;
  showSidebar?: boolean;
  rightPane?: React.ReactNode;
}) {
  const { communities } = useCommunities();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <ServerRail activeSlug={activeSlug} communities={communities} />
      {showSidebar && <Sidebar activeSlug={activeSlug} communities={communities} />}
      <main id="main-content" className="relative flex-1 overflow-y-auto bg-content" role="main">{children}</main>
      {rightPane && <div className="hidden w-[240px] shrink-0 lg:block" aria-label="Additional information">{rightPane}</div>}
    </div>
  );
}
