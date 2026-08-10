import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/serializers';
import { json, badRequest, readJson, unauthorized } from '@/lib/api';
import { updateProfileSchema } from '@/lib/validation';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rl = await rateLimit(`rl:settings:${session.user.id}`, 60_000, 10);
  if (!rl.allowed) {
    return json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  const data: Record<string, unknown> = {};
  if (parsed.data.username !== undefined) {
    const existing = await prisma.user.findFirst({
      where: { username: parsed.data.username, id: { not: session.user.id } },
    });
    if (existing) return json({ error: 'Username already taken' }, { status: 409 });
    data.username = parsed.data.username;
  }
  if (parsed.data.avatarUrl !== undefined) data.image = parsed.data.avatarUrl;

  if (Object.keys(data).length === 0) return badRequest('Nothing to update');

  const user = await prisma.user.update({ where: { id: session.user.id }, data });
  return json(serializeUser(user, true));
}
