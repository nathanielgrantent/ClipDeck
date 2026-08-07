'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMe } from '@/hooks';
import { formatBytes } from '@gamingclips/shared';

function StorageMeter({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className="rounded-card bg-surface border border-black/20 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text-primary">Storage Usage</span>
        <span className="text-text-secondary">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sidebar-hover">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {(100 - pct).toFixed(1)}% remaining
      </p>
    </div>
  );
}

export default function UploadPage() {
  const { status } = useSession();
  const { me, isLoading } = useMe();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-6 text-xl font-bold text-text-primary">Upload</h1>

      {me && (
        <div className="mb-6">
          <StorageMeter used={me.storageUsedBytes} total={me.storageQuotaBytes} />
        </div>
      )}

      <div className="rounded-card bg-surface border border-black/20 p-6">
        <p className="text-sm text-text-secondary">
          Upload a gaming clip or screenshot. Supported formats: MP4, WebM, PNG, JPG, GIF.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Maximum file size: 500MB. Videos will be transcoded to HLS for streaming.
        </p>
      </div>
    </div>
  );
}
