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

function osIcon(os: OS, size = 24) {
  if (os === 'windows')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l8-1.25V12H3zm0 .5h8v6.25l-8-1.25V12.5zM11.5 12V5.35l9.5-1.6V12h-9.5zm0 .5h9.5v8.25l-9.5-1.6V12.5z" />
      </svg>
    );
  if (os === 'macos')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.311.015-.466.045C9.902.377 8.39 2.3 8.39 4.588v2.125c-2.284.105-4.17 1.27-4.17 3.287v5.29c0 2.017 1.886 3.182 4.17 3.287v2.125c0 2.289 1.512 4.21 3.648 4.544.155.03.31.045.466.045 3.444 0 6.24-2.796 6.24-6.24V6.24c0-3.444-2.796-6.24-6.24-6.24zm3.734 17.015h-.002c-1.1 0-2-.9-2-2s.9-2 2-2c.265 0 .52.052.753.148-.345-.87-.92-1.65-1.678-2.275v2.127h-3.057v-2.125c-.757.625-1.333 1.405-1.678 2.275.233-.096.488-.148.753-.148 1.1 0 2 .9 2 2s-.9 2-2 2c-.265 0-.52-.052-.753-.148.345.87.92 1.65 1.678 2.275v-2.127h3.057v2.125c.757-.625 1.333-1.405 1.678-2.275-.233.096-.488.148-.753.148z" />
    </svg>
  );
}

const GITHUB_REPO = 'https://github.com/nathanielgrantent/ClipDeck';

interface PlatformDownload {
  os: OS;
  label: string;
  description: string;
  fileName: string;
  format: string;
  ext: string;
  fileSize: string;
  installInstructions: string;
  requirements: string;
  fallbackUrl: string;
}

const platforms: PlatformDownload[] = [
  {
    os: 'windows',
    label: 'Windows',
    description: 'Full installer for Windows 10/11. Adds Start Menu shortcut, file associations, and auto-start with Windows.',
    fileName: 'ClipDeck-Setup-1.0.0.exe',
    format: 'Windows Installer',
    ext: '.exe',
    fileSize: '~45 MB',
    installInstructions: 'Double-click the .exe file and follow the setup wizard. The app will be installed to Program Files and added to your Start Menu.',
    requirements: 'Windows 10 or later (64-bit), 4 GB RAM, 500 MB disk space',
    fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-Setup-1.0.0.exe`,
  },
  {
    os: 'macos',
    label: 'macOS',
    description: 'Native macOS app bundle. Drag to Applications folder. Supports Apple Silicon and Intel Macs.',
    fileName: 'ClipDeck-1.0.0.dmg',
    format: 'Disk Image',
    ext: '.dmg',
    fileSize: '~50 MB',
    installInstructions: 'Open the .dmg file, then drag the ClipDeck app to your Applications folder. First launch may require right-click > Open due to Gatekeeper.',
    requirements: 'macOS 12 Monterey or later, 4 GB RAM, 500 MB disk space',
    fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-1.0.0.dmg`,
  },
  {
    os: 'linux',
    label: 'Linux',
    description: 'Portable AppImage. No installation required. Works on Ubuntu, Fedora, Debian, and most distros.',
    fileName: 'ClipDeck-1.0.0.AppImage',
    format: 'AppImage',
    ext: '.AppImage',
    fileSize: '~40 MB',
    installInstructions: 'Make executable: chmod +x ClipDeck-1.0.0.AppImage, then run. Optionally integrate with your desktop using appimaged.',
    requirements: 'Ubuntu 20.04+ / Fedora 36+ / Debian 11+, 4 GB RAM, 500 MB disk space',
    fallbackUrl: `${GITHUB_REPO}/releases/latest/download/ClipDeck-1.0.0.AppImage`,
  },
];

export default function DownloadPage() {
  const [releases, setReleases] = useState<DesktopRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectedOS] = useState<OS>(() => detectOS());
  const [expandedPlatform, setExpandedPlatform] = useState<OS | null>(null);

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
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-text-primary">Download ClipDeck Desktop</h1>
          <p className="mt-3 text-sm text-text-secondary max-w-lg mx-auto">
            Record, clip, and share your best gaming moments. The desktop app adds native screen capture,
            large file uploads, and instant notifications.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              Free &amp; Open Source
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              No Account Required
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Privacy First
            </span>
          </div>
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

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Choose Your Platform</h2>
          <p className="text-xs text-text-muted">Select your operating system below to download the correct installer.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {platforms.map((platform) => {
              const osReleases = grouped[platformOrder[platform.os]];
              const latest = osReleases?.[0];
              const isDetected = detectedOS === platform.os;
              const isExpanded = expandedPlatform === platform.os;
              const downloadUrl = latest?.url || platform.fallbackUrl;

              return (
                <div key={platform.os} className={cn(
                  'rounded-xl border transition-all',
                  isDetected
                    ? 'border-accent/30 bg-accent/5'
                    : 'border-black/10 bg-surface',
                )}>
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                        isDetected ? 'bg-accent/15 text-accent' : 'bg-sidebar-hover text-text-muted',
                      )}>
                        {osIcon(platform.os, 28)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-text-primary">{platform.label}</h3>
                          {isDetected && (
                            <span className="chip bg-accent/10 text-accent text-[10px] font-medium">Detected</span>
                          )}
                          <span className="chip bg-sidebar-hover text-text-muted text-[10px]">{platform.format}</span>
                          <span className="text-[11px] text-text-muted">{platform.fileSize}</span>
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">{platform.description}</p>

                        <div className="mt-4 flex items-center gap-3 flex-wrap">
                          <a
                            href={downloadUrl}
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
                            Download {platform.fileName}
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
                          <button
                            onClick={() => setExpandedPlatform(isExpanded ? null : platform.os)}
                            className="inline-flex items-center gap-1.5 rounded-btn px-3 py-2.5 text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-sidebar-hover transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('transition-transform', isExpanded && 'rotate-180')}>
                              <polyline points="6,9 12,15 18,9" />
                            </svg>
                            {isExpanded ? 'Less info' : 'Install guide'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 ml-16 p-4 rounded-lg bg-sidebar-hover/50 border border-black/5">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-1">File</p>
                            <p className="text-xs text-text-secondary font-mono">{platform.fileName}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-1">How to Install</p>
                            <p className="text-xs text-text-secondary">{platform.installInstructions}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-1">Requirements</p>
                            <p className="text-xs text-text-secondary">{platform.requirements}</p>
                          </div>
                          {latest?.notes && (
                            <div>
                              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide mb-1">Release Notes</p>
                              <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{latest.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              What's Included
            </h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Global hotkey screen capture (Ctrl+Shift+C)
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Drag &amp; drop file upload with progress
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Desktop notifications for votes &amp; replies
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                System tray icon with quick actions
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                500MB storage quota meter
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Security &amp; Privacy
            </h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Open source — audit the code yourself
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                No telemetry or tracking
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Files stay on your device until you upload
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                OAuth login — no password stored locally
              </li>
              <li className="flex items-start gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-green-500">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Auto-updates with signed releases
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Build from Source</h3>
          <p className="text-xs text-text-secondary mb-3">
            Want to build the desktop app yourself? Clone the repo and build with Tauri:
          </p>
          <pre className="bg-sidebar-hover rounded-lg p-3 text-[11px] text-text-secondary overflow-x-auto">
{`git clone ${GITHUB_REPO}.git
cd ClipDeck
npm install
cd apps/desktop
npm run tauri build`}
          </pre>
          <p className="mt-3 text-[11px] text-text-muted">
            See the <a href={`${GITHUB_REPO}#development-setup`} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">README</a> for full setup instructions. Requires Rust, Node.js, and platform-specific dependencies.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-text-muted">
            Having issues? Check the <a href={`${GITHUB_REPO}/issues`} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">GitHub Issues</a> or join our <a href="/c/clipdeckshowcase" className="text-accent hover:underline">community</a>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
