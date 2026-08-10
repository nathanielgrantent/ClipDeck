import fs from 'node:fs';
import path from 'node:path';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { enqueueTranscode } from '@/lib/queue';
import { ensureUploadDirs, originalRelativePath, resolveUploadPath } from '@/lib/storage';
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from '@/lib/api';
import { MAX_UPLOAD_BYTES } from '@gamingclips/shared';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
};

/** Magic-byte signatures for validating actual file content. */
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0 },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp
  { mime: 'video/quicktime', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp (MOV)
  { mime: 'video/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 }, // EBML
  { mime: 'video/x-matroska', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0 }, // EBML
];

function validateMagicBytes(header: Buffer, declaredMime: string): boolean {
  // Only validate types we have signatures for
  const sig = MAGIC_BYTES.find((m) => m.mime === declaredMime);
  if (!sig) return true; // No signature to validate against
  const slice = header.subarray(sig.offset, sig.offset + sig.bytes.length);
  return sig.bytes.every((b, i) => slice[i] === b);
}

async function chargeStorage(userId: string, bytes: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('no-user');
    const used = Number(user.storageUsedBytes);
    const quota = Number(user.storageQuotaBytes);
    if (used + bytes > quota) throw new Error('quota-exceeded');
    return tx.user.update({
      where: { id: userId },
      data: { storageUsedBytes: used + bytes },
    });
  });
}

/** Binary upload for an existing session (step 2 of the two-step upload flow). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:upload:binary:${session.user.id}`, 60_000, 10);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return notFound('Upload session not found');
  if (asset.userId !== session.user.id) return forbidden();
  if (asset.status !== 'PROCESSING') return badRequest('Upload already completed');

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (!contentLength || contentLength <= 0) return badRequest('Missing content-length');
  if (contentLength > MAX_UPLOAD_BYTES) {
    return json(
      { error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB per-user limit` },
      { status: 413 },
    );
  }

  await ensureUploadDirs();

  try {
    await chargeStorage(session.user.id, contentLength);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'quota-exceeded') {
      return json({ error: 'Storage quota exceeded' }, { status: 413 });
    }
    if (msg === 'no-user') return unauthorized();
    throw err;
  }

  const ext = EXT_BY_MIME[asset.mime] ?? (asset.type === 'IMAGE' ? 'img' : 'vid');
  const originalRel = originalRelativePath(session.user.id, asset.id, ext);
  const hlsDirRel = path.posix.join('hls', session.user.id, asset.id);
  const absOriginal = resolveUploadPath(originalRel);

  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: {
      originalPath: originalRel,
      originalUrl: `/media/${originalRel.split(path.sep).join('/')}`,
    },
  });

  try {
    await fs.promises.mkdir(path.dirname(absOriginal), { recursive: true });
    const body = req.body;
    if (!body) throw new Error('no body');

    const reader = body.getReader();
    const writer = fs.createWriteStream(absOriginal);

    // Collect the first 16 bytes for magic-byte validation
    const headerBuf = Buffer.alloc(16);
    let headerWritten = 0;
    let totalWritten = 0;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      // Fill header buffer for magic-byte check
      if (headerWritten < 16) {
        const copy = Math.min(value.length, 16 - headerWritten);
        Buffer.from(value.buffer, value.byteOffset, copy).copy(headerBuf, headerWritten);
        headerWritten += copy;
      }

      writer.write(Buffer.from(value));
      totalWritten += value.length;
    }
    await new Promise<void>((res, rej) =>
      writer.end((err: Error | null) => (err ? rej(err) : res())),
    );

    const written = (await fs.promises.stat(absOriginal)).size;
    if (written !== contentLength) {
      throw new Error('size mismatch');
    }

    // Validate magic bytes match declared MIME type
    if (!validateMagicBytes(headerBuf, asset.mime)) {
      throw new Error('file content does not match declared MIME type');
    }
  } catch (err: unknown) {
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: 'FAILED' } });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsedBytes: { decrement: contentLength } },
    });
    await fs.promises.rm(absOriginal, { force: true }).catch(() => {});
    console.error('[upload] write failed', err);
    return serverError('Upload failed');
  }

  try {
    await enqueueTranscode({
      assetId: asset.id,
      userId: session.user.id,
      originalPath: originalRel,
      outputDir: hlsDirRel,
      mime: asset.mime,
    });
  } catch (err: unknown) {
    // Queue unavailable: fail the asset and refund storage so the user is not charged.
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: 'FAILED' } });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsedBytes: { decrement: contentLength } },
    });
    await fs.promises.rm(absOriginal, { force: true }).catch(() => {});
    console.error('[upload] enqueue failed', err);
    return serverError('Upload processing is temporarily unavailable');
  }

  return json(
    {
      assetId: asset.id,
      type: asset.type,
      status: 'PROCESSING',
      originalUrl: `/media/${originalRel.split(path.sep).join('/')}`,
    },
    { status: 201, headers: rateLimitHeaders(rl) },
  );
}
