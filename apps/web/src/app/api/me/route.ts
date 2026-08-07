import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/serializers';
import { badRequest, json, readJson, unauthorized } from '@/lib/api';
import { updateProfileSchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return unauthorized();

  return json(serializeUser(user, true));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const data: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) data.username = parsed.data.username;
  if (parsed.data.avatarUrl !== undefined) data.image = parsed.data.avatarUrl;

  if (Object.keys(data).length === 0) return badRequest('Nothing to update');

  if (data.username !== undefined) {
    const taken = await prisma.user.findUnique({
      where: { username: data.username as string },
      select: { id: true },
    });
    if (taken && taken.id !== session.user.id) {
      return json({ error: 'Username is already taken' }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return json(serializeUser(user, true));
}
