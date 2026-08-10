import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeNotification } from '@/lib/serializers';
import { json, readJson, badRequest, unauthorized } from '@/lib/api';
import { markNotificationSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      body: true,
      href: true,
      read: true,
      createdAt: true,
    },
  });

  return json(notifications.map(serializeNotification));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest('Invalid JSON body');

  const parsed = markNotificationSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  if (parsed.data.markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  } else if (parsed.data.id) {
    await prisma.notification.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { read: true },
    });
  }
  return json({ ok: true });
}
