'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMe } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPatch } from '@/lib/client';
import { cn } from '@/lib/utils';
import { formatBytes } from '@gamingclips/shared';

export default function SettingsPage() {
  const { status } = useSession();
  const { me, isLoading, mutate } = useMe();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const meRef = me;
  if (meRef && !formReady) {
    setUsername(meRef.username);
    setAvatarUrl(meRef.avatarUrl || '');
    setFormReady(true);
  }

  if (status === 'loading' || isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg p-4 sm:p-6 space-y-4">
          <Skeleton lines={1} className="w-32" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </AppShell>
    );
  }

  if (!me) return null;

  const storagePct = Math.min(100, (me.storageUsedBytes / me.storageQuotaBytes) * 100);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      await apiPatch('/api/me', {
        username: username.trim() || undefined,
        avatarUrl: avatarUrl.trim() || null,
      });
      await mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg p-4 sm:p-6">
        <h1 className="mb-6 text-xl font-bold text-text-primary">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              maxLength={24}
            />
            <Input
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Storage</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Used</span>
              <span className="text-text-primary font-medium">
                {formatBytes(me.storageUsedBytes)} / {formatBytes(me.storageQuotaBytes)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sidebar-hover">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  storagePct > 90 ? 'bg-red-500' : storagePct > 70 ? 'bg-amber-400' : 'bg-accent',
                )}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">Account</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Email</dt>
                <dd className="text-text-primary">{me.email || 'Not provided'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Role</dt>
                <dd className="text-text-primary capitalize">{me.role.toLowerCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Karma</dt>
                <dd className="text-text-primary">{me.karma}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Member Since</dt>
                <dd className="text-text-primary">{new Date(me.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && <p className="text-sm text-green-400">Settings saved!</p>}

          <Button type="submit" variant="primary" loading={saving} className="w-full">
            Save Changes
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
