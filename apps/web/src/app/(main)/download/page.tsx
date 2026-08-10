'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.25l-8-1.25V12.5zM11.5 12V5.35l9.5-1.6V12h-9.5zm0 .5h9.5v8.25l-9.5-1.6V12.5z" />
      </svg>
    );
  if (os === 'macos')
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.311.015-.466.045C9.902.377 8.39 2.3 8.39 4.588v2.125c-2.284.105-4.17 1.27-4.17 3.287v5.29c0 2.017 1.886 3.182 4.17 3.287v2.125c0 2.289 1.512 4.21 3.648 4.544.155.03.31.045.466.045 3.444 0 6.24-2.796 6.24-6.24V6.24c0-3.444-2.796-6.24-6.24-6.24zm3.734 17.015h-.002c-1.1 0-2-.9-2-2s.9-2 2-2c.265 0 .52.052.753.148-.345-.87-.92-1.65-1.678-2.275v2.127h-3.057v-2.125c-.757.625-1.333 1.405-1.678 2.275.233-.096.488-.148.753-.148 1.1 0 2 .9 2 2s-.9 2-2 2c-.265 0-.52-.052-.753-.148.345.87.92 1.65 1.678 2.275v-2.127h3.057v2.125c.757-.625 1.333-1.405 1.678-2.275-.233.096-.488.148-.753.148z" />
    </svg>
  );
}

const GITHUB_REPO = 'https://github.com/nathanielgrantent/ClipDeck';
const platformInfo: Record<OS, { label: string; format: string; ext: string; fallbackUrl: string }> = {
  windows: { label: 'Windows', format: 'Installer (.exe)', ext: '.exe', fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-Setup-1.0.0.exe` },
  macos: { label: 'macOS', format: 'Disk Image (.dmg)', ext: '.dmg', fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-1.0.0.dmg` },
  linux: { label: 'Linux', format: 'AppImage', ext: '.AppImage', fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-1.0.0.AppImage` },
};

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
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-text-primary">ClipDeck Desktop</h1>
          <p className="mt-3 text-sm text-text-secondary max-w-md mx-auto">
            Record, clip, and share your best gaming moments. The desktop app adds native screen capture,
            large file uploads, and instant notifications.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {[
            { icon: '🎬', title: 'Screen Capture', desc: 'Record clips with a global hotkey, auto-tagged with your game.' },
            { icon: '📤', title: 'Drag & Drop Upload', desc: 'Drop large files directly. Progress bar and 500MB quota meter.' },
            { icon: '🔔', title: 'Live Notifications', desc: 'Get pinged for replies, votes, and mod actions in real time.' },
          ].map((f) => (
            <div key={f.title} className="card p-4 text-center">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 text-sm font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-1 text-xs text-text-muted">{f.desc}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {(['windows', 'macos', 'linux'] as OS[]).map((os) => {
              const osReleases = grouped[platformOrder[os]];
              const latest = osReleases?.[0];
              const isDetected = detectedOS === os;
              const info = platformInfo[os];

              return (
                <div key={os}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      isDetected ? 'bg-accent/15 text-accent' : 'bg-sidebar-hover text-text-muted',
                    )}>
                      {osIcon(os)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-text-primary">{info.label}</h2>
                        {isDetected && (
                          <span className="chip bg-accent/10 text-accent text-[10px]">Detected</span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{info.format}</p>
                    </div>
                  </div>

                  {latest ? (
                    <div className={cn(
                      'card p-4 transition-colors',
                      isDetected && 'border-accent/30 ring-1 ring-accent/10',
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-text-muted">ClipDeck Desktop</span>
                          <span className="ml-2 chip bg-sidebar-hover text-text-secondary text-[10px]">
                            v{latest.version}
                          </span>
                          <p className="mt-1 text-[11px] text-text-muted">
                            Released {new Date(latest.publishedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                        <a
                          href={latest?.url || info.fallbackUrl}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-btn px-5 py-2.5 text-sm font-medium transition-colors',
                            isDetected
                              ? 'bg-accent text-white hover:bg-accent-hover'
                              : 'bg-sidebar-hover text-text-primary hover:bg-sidebar-active',
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </a>
                        <a
                          href={`${GITHUB_REPO}/releases/latest`}
                          className="inline-flex items-center gap-2 rounded-btn px-4 py-2.5 text-sm font-medium bg-sidebar-hover text-text-secondary hover:bg-sidebar-active transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          View on GitHub
                        </a>
                      </div>
                      </div>
                      {latest.notes && (
                        <div className="mt-3 border-t border-black/10 pt-3">
                          <p className="text-[11px] font-medium text-text-muted mb-1">Release Notes</p>
                          <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{latest.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="card p-4">
                      <p className="text-sm text-text-muted text-center py-2">
                        Coming soon for {info.label}.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">System Requirements</h3>
          <div className="grid gap-4 sm:grid-cols-3 text-xs text-text-secondary">
            <div>
              <p className="font-medium text-text-primary mb-1">Windows</p>
              <p>Windows 10 or later<br/>4 GB RAM<br/>500 MB disk space</p>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">macOS</p>
              <p>macOS 12 Monterey or later<br/>4 GB RAM<br/>500 MB disk space</p>
            </div>
            <div>
              <p className="font-medium text-text-primary mb-1">Linux</p>
              <p>Ubuntu 20.04+ / Fedora 36+<br/>4 GB RAM<br/>500 MB disk space</p>
            </div>
          </div>
        </div>

        <div className="mt-6 card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Build from Source</h3>
          <p className="text-xs text-text-secondary mb-3">
            Pre-built binaries are coming soon. In the meantime, you can build the desktop app from source:
          </p>
          <pre className="bg-sidebar-hover rounded-lg p-3 text-[11px] text-text-secondary overflow-x-auto">
{`git clone ${GITHUB_REPO}.git
cd ClipDeck
npm install
cd apps/desktop
npm run tauri build`}
          </pre>
          <p className="mt-3 text-[11px] text-text-muted">
            See the <a href={`${GITHUB_REPO}#development-setup`} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">README</a> for full setup instructions.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
