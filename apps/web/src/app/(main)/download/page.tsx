'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiGet } from '@/lib/client';
import type { DesktopRelease } from '@gamingclips/shared';

type OS = 'windows' | 'macos' | 'linux';

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'windows';
}

function osIcon(os: OS) {
  if (os === 'windows')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.25l-8-1.25V12.5zM11.5 12V5.35l9.5-1.6V12h-9.5zm0 .5h9.5v8.25l-9.5-1.6V12.5z" />
      </svg>
    );
  if (os === 'macos')
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.311.015-.466.045C9.902.377 8.39 2.3 8.39 4.588v2.125c-2.284.105-4.17 1.27-4.17 3.287v5.29c0 2.017 1.886 3.182 4.17 3.287v2.125c0 2.289 1.512 4.21 3.648 4.544.155.03.31.045.466.045 3.444 0 6.24-2.796 6.24-6.24V6.24c0-3.444-2.796-6.24-6.24-6.24zm3.734 17.015h-.002c-1.1 0-2-.9-2-2s.9-2 2-2c.265 0 .52.052.753.148-.345-.87-.92-1.65-1.678-2.275v2.127h-3.057v-2.125c-.757.625-1.333 1.405-1.678 2.275.233-.096.488-.148.753-.148 1.1 0 2 .9 2 2s-.9 2-2 2c-.265 0-.52-.052-.753-.148.345.87.92 1.65 1.678 2.275v-2.127h3.057v2.125c.757-.625 1.333-1.405 1.678-2.275-.233.096-.488.148-.753.148z" />
    </svg>
  );
}

function ReleaseCard({
  release,
  isRecommended,
}: {
  release: DesktopRelease;
  isRecommended: boolean;
}) {
  const platformLabel: Record<string, string> = {
    WIN: 'Windows',
    MAC: 'macOS',
    LINUX: 'Linux',
  };

  return (
    <div
      className={cn(
        'card p-4 transition-colors',
        isRecommended && 'border-accent/40 ring-1 ring-accent/20',
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">
              ClipDeck Desktop
            </span>
            <span className="chip bg-accent/10 text-accent text-[10px]">
              v{release.version}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {platformLabel[release.platform] || release.platform} · {new Date(release.publishedAt).toLocaleDateString()}
          </p>
        </div>
        <a
          href={release.url}
          className={cn('btn text-xs', isRecommended ? 'btn-primary' : 'btn-secondary')}
          download
        >
          Download
        </a>
      </div>
      {release.notes && (
        <p className="mt-3 text-xs text-text-secondary whitespace-pre-wrap">{release.notes}</p>
      )}
    </div>
  );
}

export default function DownloadPage() {
  const [releases, setReleases] = useState<DesktopRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedOS] = useState<OS>(() => detectOS());

  useEffect(() => {
    apiGet<DesktopRelease[]>('/api/releases')
      .then(setReleases)
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = releases.reduce<Record<string, DesktopRelease[]>>((acc, r) => {
    const key = r.platform;
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  const platformOrder: Record<OS, string> = {
    windows: 'WIN',
    macos: 'MAC',
    linux: 'LINUX',
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-8 text-center">
          <div className="text-5xl">🖥️</div>
          <h1 className="mt-4 text-2xl font-bold text-text-primary">ClipDeck Desktop</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Download the desktop app for the best clip recording and sharing experience.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-text-secondary">No releases available yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['windows', 'macos', 'linux'] as OS[]).map((os) => {
              const osReleases = grouped[platformOrder[os]];
              if (!osReleases || osReleases.length === 0) return null;
              const latest = osReleases[0];
              return (
                <div key={os}>
                  <div className="mb-2 flex items-center gap-2">
                    {osIcon(os)}
                    <h2 className="text-sm font-semibold text-text-primary capitalize">{os}</h2>
                    {detectedOS === os && (
                      <span className="chip bg-accent/10 text-accent text-[10px]">Detected</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <ReleaseCard release={latest} isRecommended={detectedOS === os} />
                    {osReleases.slice(1).map((r) => (
                      <ReleaseCard key={r.version} release={r} isRecommended={false} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
