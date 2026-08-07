import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, json, notFound, readJson, unauthorized } from '@/lib/api';
import { canModerate, isSiteAdmin } from '@/lib/moderators';
import { parseJson } from '@gamingclips/shared';
import type { AutomodRule, AutomodActionType } from '@gamingclips/shared';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await readJson<{ enabled?: boolean }>(req);
  if (!body || typeof body.enabled !== 'boolean') {
    return badRequest('Missing enabled');
  }

  const rule = await prisma.automodRule.findUnique({
    where: { id },
    include: { community: true },
  });
  if (!rule) return notFound('Rule not found');

  if (rule.scope === 'GLOBAL') {
    if (!(await isSiteAdmin(session.user.id))) return forbidden();
  } else {
    const slug = rule.community?.slug;
    if (!slug || !(await canModerate(session, slug))) return forbidden();
  }

  const updated = await prisma.automodRule.update({
    where: { id },
    data: { enabled: body.enabled },
    include: { community: true },
  });

  const dto: AutomodRule = {
    id: updated.id,
    name: updated.name,
    scope: updated.scope as AutomodRule['scope'],
    communitySlug: updated.community?.slug ?? undefined,
    enabled: updated.enabled,
    priority: updated.priority,
    conditions: parseJson<AutomodRule['conditions']>(updated.conditions, {}),
    actions: parseJson<AutomodRule['actions']>(updated.actions, []),
    scoreThreshold: updated.scoreThreshold ?? undefined,
    escalateTo: (updated.escalateTo as AutomodActionType) ?? undefined,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };

  return json(dto);
}
