import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeNotification } from '@/lib/serializers';
import { json, unauthorized } from '@/lib/api';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return json(notifications.map(serializeNotification));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { markAll?: boolean; id?: string };
  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { read: true },
    });
  }
  return json({ ok: true });
}
