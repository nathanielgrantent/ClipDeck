import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { json, badRequest, readJson, unauthorized, forbidden } from '@/lib/api';
import { automodRuleSchema } from '@/lib/validation';
import { canModerate, isSiteAdmin } from '@/lib/moderators';
import { serializeJson } from '@gamingclips/shared';
import type { AutomodRule, AutomodActionType } from '@gamingclips/shared';
import { parseJson } from '@gamingclips/shared';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const url = new URL(req.url);
  const communitySlug = url.searchParams.get('community');
  const scope = communitySlug ? 'COMMUNITY' : (url.searchParams.get('scope') ?? 'GLOBAL');

  if (scope === 'GLOBAL' && !(await isSiteAdmin(session.user.id))) {
    return forbidden();
  }
  if (scope === 'COMMUNITY' && communitySlug && !(await canModerate(session, communitySlug))) {
    return forbidden();
  }

  const rules = await prisma.automodRule.findMany({
    where:
      scope === 'GLOBAL'
        ? { scope: 'GLOBAL' }
        : { scope: 'COMMUNITY', community: { slug: communitySlug! } },
    include: { community: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  const dto: AutomodRule[] = rules.map((r) => ({
    id: r.id,
    name: r.name,
    scope: r.scope as AutomodRule['scope'],
    communitySlug: r.community?.slug ?? undefined,
    enabled: r.enabled,
    priority: r.priority,
    conditions: parseJson<AutomodRule['conditions']>(r.conditions, {}),
    actions: parseJson<AutomodRule['actions']>(r.actions, []),
    scoreThreshold: r.scoreThreshold ?? undefined,
    escalateTo: (r.escalateTo as AutomodActionType) ?? undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return json(dto);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return badRequest();

  const parsed = automodRuleSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message);

  if (parsed.data.scope === 'GLOBAL' && !(await isSiteAdmin(session.user.id))) {
    return forbidden();
  }
  if (parsed.data.scope === 'COMMUNITY' && parsed.data.communitySlug) {
    if (!(await canModerate(session, parsed.data.communitySlug))) return forbidden();
  }

  const community = parsed.data.communitySlug
    ? await prisma.community.findUnique({ where: { slug: parsed.data.communitySlug } })
    : null;
  if (parsed.data.scope === 'COMMUNITY' && !community) return badRequest('Community not found');

  const rule = await prisma.automodRule.create({
    data: {
      name: parsed.data.name,
      scope: parsed.data.scope,
      communityId: community?.id ?? null,
      enabled: parsed.data.enabled,
      priority: parsed.data.priority,
      conditions: serializeJson(parsed.data.conditions),
      actions: serializeJson(parsed.data.actions),
      scoreThreshold: parsed.data.scoreThreshold ?? null,
      escalateTo: parsed.data.escalateTo ?? null,
      authorId: session.user.id,
    },
  });

  return json({ id: rule.id, ok: true }, { status: 201 });
}
