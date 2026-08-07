'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useMe } from '@/hooks';
import { cn } from '@/lib/utils';

export function NavigationHeader() {
  const { status } = useSession();
  const { me } = useMe();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        setSearchOpen(false);
        setSearchQuery('');
      }
    },
    [searchQuery],
  );

  return (
    <header className="h-12 flex items-center justify-between border-b border-black/20 bg-content px-4 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="6" fill="#5865F2" />
          <path d="M8 8l4 4-4 4M13 16h3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-bold text-white hidden sm:inline">ClipDeck</span>
      </Link>

      {/* Search bar */}
      <div className="flex-1 max-w-lg mx-4">
        <button
          onClick={() => {
            setSearchOpen(true);
            setTimeout(() => searchRef.current?.focus(), 50);
          }}
          className="flex items-center gap-2 w-full rounded-btn bg-content-input px-3 py-1.5 text-sm text-text-muted hover:bg-sidebar-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Search</span>
          <span className="hidden sm:inline ml-auto">
            <span className="kbd">Ctrl</span>
            <span className="kbd ml-0.5">K</span>
          </span>
        </button>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-2">
        {status === 'authenticated' && me ? (
          <DropdownMenu
            align="right"
            trigger={
              <div className="flex items-center gap-2 rounded-btn px-2 py-1 hover:bg-sidebar-hover transition-colors cursor-pointer">
                <Avatar src={me.avatarUrl} name={me.username} size={24} />
                <span className="text-sm font-medium text-text-primary hidden sm:inline">{me.username}</span>
              </div>
            }
            items={[
              { label: 'Profile', onClick: () => (window.location.href = `/u/${me.username}`) },
              { label: 'Settings', onClick: () => (window.location.href = '/settings') },
              { label: '', separator: true },
              { label: 'Sign out', danger: true, onClick: () => signOut() },
            ]}
          />
        ) : (
          <Link href="/login" className="btn-primary text-sm px-3 py-1.5">
            Sign in
          </Link>
        )}
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 animate-fade-in">
          <div className="w-full max-w-lg mx-4">
            <form onSubmit={handleSearch} className="relative">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ClipDeck..."
                className="w-full rounded-card bg-surface pl-12 pr-12 py-3.5 text-sm text-text-primary placeholder:text-text-muted outline-none ring-2 ring-accent/40 focus:ring-accent"
                aria-label="Search"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
