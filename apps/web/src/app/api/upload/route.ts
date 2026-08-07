import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, json, unauthorized } from '@/lib/api';
import { MAX_UPLOAD_BYTES } from '@gamingclips/shared';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']);

/** Create an upload session (step 1 of the two-step upload flow). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  let body: { fileName?: string; fileSize?: number; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body');
  }

  const fileSize = Number(body.fileSize ?? 0);
  const contentType = (body.contentType ?? '').toLowerCase();
  const fileName = (body.fileName ?? '').trim();

  if (!fileName) return badRequest('Missing fileName');
  if (!Number.isFinite(fileSize) || fileSize <= 0) return badRequest('Missing or invalid fileSize');
  if (fileSize > MAX_UPLOAD_BYTES) {
    return json(
      { error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB per-user limit` },
      { status: 413 },
    );
  }

  let type: 'IMAGE' | 'VIDEO';
  if (IMAGE_TYPES.has(contentType)) type = 'IMAGE';
  else if (VIDEO_TYPES.has(contentType)) type = 'VIDEO';
  else return badRequest('Unsupported file type');

  // fail fast on quota; the authoritative check happens on binary upload
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storageUsedBytes: true, storageQuotaBytes: true },
  });
  if (!user) return unauthorized();
  if (Number(user.storageUsedBytes) + fileSize > Number(user.storageQuotaBytes)) {
    return json({ error: 'Storage quota exceeded' }, { status: 413 });
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      userId: session.user.id,
      type,
      mime: contentType,
      sizeBytes: BigInt(fileSize),
      status: 'PROCESSING',
      originalPath: '',
    },
  });

  return json(
    {
      id: asset.id,
      uploadUrl: `/api/upload/${asset.id}`,
      assetId: asset.id,
      mediaType: type,
      maxBytes: MAX_UPLOAD_BYTES,
    },
    { status: 201 },
  );
}
