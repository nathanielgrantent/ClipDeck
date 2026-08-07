import fs from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { resolveUploadPath } from '@/lib/storage';
import { notFound, serverError } from '@/lib/api';

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
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  let rel = segments.join('/');

  // A bare asset id (`/api/media/{id}`) resolves via the database.
  if (segments.length === 1 && !segments[0].includes('.')) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: segments[0] } });
    if (asset?.originalPath) rel = asset.originalPath;
    else return notFound();
  }

  let abs: string;
  try {
    abs = resolveUploadPath(rel);
  } catch {
    return notFound();
  }

  let file: Buffer;
  try {
    file = await fs.readFile(abs);
  } catch {
    return notFound();
  }

  const ext = rel.split('.').pop()?.toLowerCase() ?? '';
  const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  });
}
