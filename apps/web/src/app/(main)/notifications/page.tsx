'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, timeAgo } from '@/lib/utils';
import { apiPost } from '@/lib/client';
import Link from 'next/link';
import type { Notification } from '@gamingclips/shared';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const iconClass = 'h-4 w-4';
  switch (type) {
    case 'REPLY':
      return (
        <svg className={cn(iconClass, 'text-blue-400')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    case 'VOTE':
      return (
        <svg className={cn(iconClass, 'text-upvote')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5l7 9H5l7-9z" />
        </svg>
      );
    case 'MENTION':
      return (
        <svg className={cn(iconClass, 'text-amber-400')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" />
        </svg>
      );
    case 'MOD_ACTION':
      return (
        <svg className={cn(iconClass, 'text-red-400')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V4l8-3z" />
        </svg>
      );
    default:
      return (
        <svg className={cn(iconClass, 'text-text-muted')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  async function handleClick() {
    if (!notification.read) {
      try {
        await apiPost('/api/notifications', { id: notification.id });
        onRead(notification.id);
      } catch {
        // silent
      }
    }
  }

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 rounded-card border border-black/20 p-3 transition-colors cursor-pointer',
        notification.read
          ? 'bg-surface hover:bg-surface-raised'
          : 'bg-accent/5 border-accent/20 hover:bg-accent/10',
      )}
    >
      <div className="shrink-0 mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm',
          notification.read ? 'text-text-secondary' : 'text-text-primary font-medium',
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">{notification.body}</p>
        )}
        <p className="mt-1 text-[10px] text-text-muted">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.read && (
        <div className="shrink-0 mt-1 h-2 w-2 rounded-full bg-accent" />
      )}
    </div>
  );

  if (notification.href) {
    return <Link href={notification.href}>{content}</Link>;
  }
  return content;
}

export default function NotificationsPage() {
  const { notifications, isLoading, mutate } = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await apiPost('/api/notifications', { markAll: true });
      mutate(
        notifications.map((n) => ({ ...n, read: true })),
        { revalidate: false },
      );
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  }

  function handleRead(id: string) {
    mutate(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      { revalidate: false },
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-text-muted">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllRead}
              loading={markingAll}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="text-5xl">🔔</div>
            <h2 className="text-lg font-semibold text-text-primary">No notifications yet</h2>
            <p className="text-sm text-text-secondary">
              You will see replies, votes, and mod actions here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
