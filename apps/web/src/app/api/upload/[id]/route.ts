import fs from 'node:fs';
import path from 'node:path';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { enqueueTranscode } from '@/lib/queue';
import { ensureUploadDirs, originalRelativePath, resolveUploadPath } from '@/lib/storage';
import { badRequest, forbidden, json, notFound, serverError, unauthorized } from '@/lib/api';
import { MAX_UPLOAD_BYTES } from '@gamingclips/shared';

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
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      writer.write(Buffer.from(value));
    }
    await new Promise<void>((res, rej) =>
      writer.end((err: Error | null) => (err ? rej(err) : res())),
    );

    const written = (await fs.promises.stat(absOriginal)).size;
    if (written !== contentLength) {
      throw new Error('size mismatch');
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
    { status: 201 },
  );
}
