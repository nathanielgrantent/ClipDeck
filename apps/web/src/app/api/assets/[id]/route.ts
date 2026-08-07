import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeMedia } from '@/lib/serializers';
import { json, notFound, unauthorized } from '@/lib/api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.userId !== session.user.id) return notFound('Asset not found');

  return json(serializeMedia(asset));
}
