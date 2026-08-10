'use client';

import { useEffect, useRef } from 'react';

export function VideoPlayer({
  src,
  poster,
  controls = true,
  muted = false,
  loop = false,
  autoPlay = false,
  className,
}: {
  src: string;
  poster?: string | null;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = src.endsWith('.m3u8');

    if (isHls) {
      let cancelled = false;
      let hlsInstance: { destroy: () => void } | null = null;

      import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60,
          });
          hlsInstance = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              video.play().catch(() => {});
            }
          });
        } else {
          video.src = src;
          if (autoPlay) video.play().catch(() => {});
        }
      });

      return () => {
        cancelled = true;
        hlsInstance?.destroy();
      };
    }

    // Native playback (mp4/webm or HLS on Safari)
    video.src = src;
    if (autoPlay) video.play().catch(() => {});
    return () => {
      video.removeAttribute('src');
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls={controls}
      muted={muted}
      loop={loop}
      playsInline
      preload="metadata"
      poster={poster ?? undefined}
      className={className}
      aria-label="Video player"
    />
  );
}
