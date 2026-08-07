import { spawn } from 'node:child_process';
import path from 'node:path';

export function ffmpegPath() {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

export function ffprobePath() {
  return process.env.FFPROBE_PATH || 'ffprobe';
}

export interface ProbeResult {
  width: number;
  height: number;
  durationSeconds: number;
  hasAudio: boolean;
  rotation: number;
}

/** Probe a media file with ffprobe, returning the primary stream's info. */
export function probeFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];
    const proc = spawn(ffprobePath(), args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d));
    proc.stderr.on('data', (d) => (stderr += d));
    proc.on('error', (err) =>
      reject(new Error(`ffprobe not found: ${err.message}`)),
    );
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed (${code}): ${stderr}`));
        return;
      }
      try {
        const json = JSON.parse(stdout);
        const video = (json.streams ?? []).find(
          (s: { codec_type?: string }) => s.codec_type === 'video',
        );
        const audio = (json.streams ?? []).some(
          (s: { codec_type?: string }) => s.codec_type === 'audio',
        );
        const rotation = Number(video?.tags?.rotation ?? 0);
        const sw = Number(video?.width ?? 0);
        const sh = Number(video?.height ?? 0);
        resolve({
          width: rotation === 90 || rotation === 270 ? sh : sw,
          height: rotation === 90 || rotation === 270 ? sw : sh,
          durationSeconds: Number(json.format?.duration ?? 0),
          hasAudio: audio,
          rotation,
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

export interface HlsOutput {
  masterPath: string;
  renditions: string[];
}

/**
 * Transcode a video into an HLS multi-rendition ladder. Output layout:
 *   {outputDir}/renditions/{h}/{index}.m3u8 + segments
 *   {outputDir}/master.m3u8
 * Renditions are chosen from the source height to cap storage while keeping
 * quality reasonable (veryfast preset, capped bitrates).
 */
export function transcodeToHls(
  input: string,
  outputDir: string,
  probe: ProbeResult,
  onProgress?: (percent: number) => void,
): Promise<HlsOutput> {
  const srcH = probe.height || 720;
  const ladder: Array<{ h: number; bitrate: string; name: string }> = [];

  if (srcH >= 1080) ladder.push({ h: 1080, bitrate: '4500k', name: '1080p' });
  if (srcH >= 720) ladder.push({ h: 720, bitrate: '3000k', name: '720p' });
  ladder.push({ h: 480, bitrate: '1700k', name: '480p' });
  if (srcH < 480) ladder[0] = { h: srcH, bitrate: '1200k', name: `${srcH}p` };

  return new Promise((resolve, reject) => {
    const masterLines = ['#EXTM3U', '#EXT-X-VERSION:3'];
    const renditions: string[] = [];
    const rendered = new Set<number>();

    const audioArg = probe.hasAudio ? '-c:a aac -b:a 128k' : '-an';

    ladder.forEach((r, idx) => {
      const name = r.name;
      const rendPath = `renditions/${name}`;
      renditions.push(rendPath);
      const bandIdx = idx;
      const width = Math.round((probe.width * r.h) / Math.max(1, srcH) / 2) * 2;

      masterLines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${Number(r.bitrate.replace('k', '')) * 1000},RESOLUTION=${width}x${r.h}`,
        `${rendPath}/index.m3u8`,
      );

      const args = [
        '-y',
        '-i',
        input,
        '-vf',
        `scale=${width}:${r.h}:force_original_aspect_ratio=decrease,pad=${width}:${r.h}:(ow-iw)/2:(oh-ih)/2:black`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '21',
        '-maxrate',
        r.bitrate,
        '-bufsize',
        String(Number(r.bitrate.replace('k', '')) * 2) + 'k',
        '-c:a',
        probe.hasAudio ? 'aac' : 'copy',
        ...(probe.hasAudio ? ['-b:a', '128k'] : []),
        '-f',
        'hls',
        '-hls_time',
        '2',
        '-hls_playlist_type',
        'vod',
        '-hls_segment_filename',
        path.join(outputDir, rendPath, 'seg_%05d.ts'),
        path.join(outputDir, rendPath, 'index.m3u8'),
      ];

      const proc = spawn(ffmpegPath(), args);
      let stderr = '';
      let totalDur = probe.durationSeconds || 1;
      proc.stderr.on('data', (d: Buffer) => {
        stderr += d.toString();
        const m = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(d.toString());
        if (m) {
          const secs =
            Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
          const total = totalDur * ladder.length;
          const done = bandIdx * totalDur + secs;
          onProgress?.(Math.min(100, Math.round((done / total) * 100)));
        }
      });
      proc.on('error', (err) => reject(new Error(`ffmpeg not found: ${err.message}`)));
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffmpeg rendition ${name} failed (${code}): ${stderr.slice(-800)}`));
          return;
        }
        rendered.add(idx);
        if (rendered.size === ladder.length) {
          resolve({
            masterPath: path.join(outputDir, 'master.m3u8'),
            renditions,
          });
        }
      });
    });
  });
}

/** Generate a poster/thumbnail frame at t=1s as JPEG. */
export function generateThumbnail(
  input: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i',
      input,
      '-ss',
      '1',
      '-frames:v',
      '1',
      '-vf',
      'scale=640:-2',
      '-q:v',
      '4',
      outputPath,
    ];
    const proc = spawn(ffmpegPath(), args);
    let stderr = '';
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`thumbnail failed: ${stderr.slice(-300)}`)),
    );
  });
}
