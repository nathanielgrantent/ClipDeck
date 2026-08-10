import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { resolveUploadPath } from '@/lib/storage';
import { notFound } from '@/lib/api';

const MIME_BY_EXT: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
};

const ALLOWED_EXTENSIONS = new Set(Object.keys(MIME_BY_EXT));

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Reject empty paths
  if (segments.length === 0) return notFound();

  // Decode each segment to prevent double-encoding attacks
  const decoded = segments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  let rel = decoded.join('/');

  // A bare asset id (`/api/media/{id}`) resolves via the database.
  if (segments.length === 1 && !segments[0].includes('.')) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: segments[0] } });
    if (asset?.originalPath) rel = asset.originalPath;
    else return notFound();
  }

  // Validate file extension against allowlist
  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return notFound();
  }

  let abs: string;
  try {
    abs = resolveUploadPath(rel);
  } catch {
    return notFound();
  }

  let stat: fs.Stats;
  try {
    stat = await fsPromises.stat(abs);
  } catch {
    return notFound();
  }

  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  const fileStream = fs.createReadStream(abs);
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk: string | Buffer) => {
        const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
        controller.enqueue(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
      });
      fileStream.on('end', () => controller.close());
      fileStream.on('error', (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(stat.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
