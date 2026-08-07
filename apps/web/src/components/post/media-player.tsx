'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { MediaAsset } from '@gamingclips/shared';

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaPlayer({ media }: { media: MediaAsset }) {
  const isVideo = media.type === 'VIDEO';

  if (media.status === 'PROCESSING') {
    return (
      <div className="relative w-full bg-surface rounded-card overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          <span className="text-sm text-text-muted">Processing media...</span>
        </div>
      </div>
    );
  }

  if (media.status === 'FAILED') {
    return (
      <div className="relative w-full bg-surface rounded-card overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-400">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Failed to load media</span>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return <VideoPlayer media={media} />;
  }

  return <ImagePlayer media={media} />;
}

function VideoPlayer({ media }: { media: MediaAsset }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<unknown>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const src = `/api/media/${media.id}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: unknown = null;

    const loadVideo = async () => {
      if (media.hlsUrl && media.mime.includes('mp4')) {
        const hlsModule = await import('hls.js');
        const HlsClass = hlsModule.default;
        if (HlsClass.isSupported()) {
          hls = new HlsClass();
          hlsRef.current = hls;
          (hls as { loadSource: (url: string) => void }).loadSource(media.hlsUrl);
          (hls as { attachMedia: (v: HTMLVideoElement) => void }).attachMedia(video);
          (hls as { on: (event: string, cb: () => void) => void }).on(
            (hlsModule as unknown as { Events: { MANIFEST_PARSED: string } }).Events.MANIFEST_PARSED,
            () => {
              video.play().catch(() => {});
            },
          );
          return;
        }
        video.src = media.hlsUrl;
      } else {
        video.src = src;
      }
      video.play().catch(() => {});
    };

    loadVideo();

    return () => {
      if (hls) {
        (hls as { destroy: () => void }).destroy();
        hlsRef.current = null;
      }
    };
  }, [media.hlsUrl, media.mime, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    const onDurationChange = () => setDuration(video.duration);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-card overflow-hidden group"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
        preload="metadata"
        poster={media.thumbnailUrl ?? undefined}
      />

      {!playing && !showControls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity"
          aria-label="Play"
        >
          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1E1F22">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      <div
        className={cn(
          'absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div
          className="relative h-1 w-full cursor-pointer rounded-full bg-white/20 mb-3 group/progress"
          onClick={handleSeek}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="text-white hover:text-accent transition-colors"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <span className="text-xs text-white/70 tabular-nums">
            {formatTime(duration * (progress / 100))} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/70">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a7 7 0 010 13.42v2.06A9 9 0 0014 3.23z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              className="w-16 h-1 accent-accent cursor-pointer"
              aria-label="Volume"
            />
            <button
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePlayer({ media }: { media: MediaAsset }) {
  const [zoomed, setZoomed] = useState(false);
  const src = media.originalUrl ?? `/api/media/${media.id}`;

  return (
    <>
      <div className="relative w-full rounded-card overflow-hidden bg-black cursor-zoom-in" onClick={() => setZoomed(true)}>
        <img
          src={src}
          alt=""
          className="w-full object-contain max-h-[70vh]"
          loading="lazy"
        />
      </div>
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out animate-fade-in"
          onClick={() => setZoomed(false)}
        >
          <img
            src={src}
            alt=""
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close zoom"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
