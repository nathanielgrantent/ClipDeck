import type {
  AutomodActions,
  AutomodConditions,
  AutomodEvaluation,
  AutomodRule,
  AutomodVerdict,
  Platform,
  PostType,
} from '@gamingclips/shared';

export interface ContentContext {
  text: string;
  title: string;
  body: string;
  type: PostType | 'COMMENT';
  mediaPresent: boolean;
  mediaType?: 'VIDEO' | 'IMAGE';
  gameNames: string[];
  platforms: Platform[];
  author: {
    ageDays: number;
    karma: number;
    newUser: boolean;
    banned: boolean;
    role: 'USER' | 'MOD' | 'ADMIN';
  };
  nsfwScore?: number;
  spamScore?: number;
  linkCount?: number;
  capitalizedWords?: number;
}

const SEVERITY: Record<string, number> = {
  ALLOW: 0,
  NOTIFY: 1,
  REPORT: 2,
  FILTER: 3,
  REMOVE: 4,
};

export function extractDomains(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s"'<>)]+/gi) ?? [];
  return urls
    .map((u) => {
      try {
        return new URL(u).hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    })
    .filter((d): d is string => Boolean(d));
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/[^\s"'<>)]+/gi) ?? []).length;
}

export function countCapitalizedWords(text: string): number {
  const words = text.match(/[A-Za-z]{4,}/g) ?? [];
  return words.filter((w) => w === w.toUpperCase()).length;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function anyKeyword(text: string, keywords: string[]): boolean {
  const t = normalize(text);
  return keywords.some((k) => t.includes(normalize(k)));
}

function allKeywords(text: string, keywords: string[]): boolean {
  const t = normalize(text);
  return keywords.every((k) => t.includes(normalize(k)));
}

function anyPattern(text: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    try {
      return new RegExp(p, 'i').test(text);
    } catch {
      return false;
    }
  });
}

function evaluateConditions(
  cond: AutomodConditions,
  ctx: ContentContext,
): string[] {
  const matched: string[] = [];
  const t = ctx.text;

  if (cond.keywords?.length && anyKeyword(t, cond.keywords)) matched.push('keywords');
  if (cond.requiredKeywords?.length && allKeywords(t, cond.requiredKeywords))
    matched.push('requiredKeywords');
  if (cond.patterns?.length && anyPattern(t, cond.patterns)) matched.push('patterns');

  const domains = extractDomains(t);
  if (cond.blockedDomains?.length) {
    const blocked = cond.blockedDomains.map((d) => d.toLowerCase());
    if (domains.some((d) => blocked.some((b) => d === b || d.endsWith('.' + b))))
      matched.push('blockedDomains');
  }
  if (cond.allowedDomains?.length && domains.length > 0) {
    const allowed = cond.allowedDomains.map((d) => d.toLowerCase());
    if (domains.every((d) => allowed.some((a) => d === a || d.endsWith('.' + a))))
      matched.push('allowedDomains');
  }

  if (cond.minBodyLength != null && ctx.body.length < cond.minBodyLength) matched.push('minBodyLength');
  if (cond.maxBodyLength != null && ctx.body.length > cond.maxBodyLength) matched.push('maxBodyLength');
  if (cond.minTitleLength != null && ctx.title.length < cond.minTitleLength) matched.push('minTitleLength');
  if (cond.maxTitleLength != null && ctx.title.length > cond.maxTitleLength) matched.push('maxTitleLength');

  if (cond.minAccountAgeDays != null && ctx.author.ageDays < cond.minAccountAgeDays) matched.push('minAccountAgeDays');
  if (cond.maxAccountAgeDays != null && ctx.author.ageDays > cond.maxAccountAgeDays) matched.push('maxAccountAgeDays');
  if (cond.minKarma != null && ctx.author.karma < cond.minKarma) matched.push('minKarma');
  if (cond.newUserOnly && ctx.author.newUser) matched.push('newUserOnly');
  if (ctx.author.banned) matched.push('authorBanned');

  if (cond.requireMedia && !ctx.mediaPresent) matched.push('requireMedia');
  if (cond.requireImage && ctx.mediaType !== 'IMAGE') matched.push('requireImage');
  if (cond.requireVideo && ctx.mediaType !== 'VIDEO') matched.push('requireVideo');
  if (cond.requireTags && ctx.gameNames.length === 0) matched.push('requireTags');

  if (cond.bannedPlatforms?.length && ctx.platforms.some((p) => cond.bannedPlatforms!.includes(p)))
    matched.push('bannedPlatforms');
  if (cond.bannedTags?.length) {
    const banned = cond.bannedTags.map((n) => normalize(n));
    if (ctx.gameNames.some((g) => banned.includes(normalize(g)))) matched.push('bannedTags');
  }

  if (cond.isNSFW && (ctx.nsfwScore ?? 0) > 0.5) matched.push('isNSFW');
  if (cond.nsfwScoreAbove != null && (ctx.nsfwScore ?? 0) >= cond.nsfwScoreAbove) matched.push('nsfwScoreAbove');
  if (cond.spamScoreAbove != null && (ctx.spamScore ?? 0) >= cond.spamScoreAbove) matched.push('spamScoreAbove');
  if (cond.linkCountAbove != null && countLinks(t) > cond.linkCountAbove) matched.push('linkCountAbove');
  if (cond.capitalizedWordsAbove != null && countCapitalizedWords(t) > cond.capitalizedWordsAbove)
    matched.push('capitalizedWordsAbove');

  return matched;
}

function evaluateRule(rule: AutomodRule, ctx: ContentContext): AutomodEvaluation {
  if (!rule.enabled) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      score: 0,
      actions: [],
      matchedConditions: [],
    };
  }

  const matchedConditions = evaluateConditions(rule.conditions, ctx);

  // required keywords must match for the rule to fire at all
  if (rule.conditions.requiredKeywords?.length && !matchedConditions.includes('requiredKeywords')) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      score: 0,
      actions: [],
      matchedConditions,
    };
  }

  const allMatching = matchedConditions.length > 0 || rule.conditions.requiredKeywords?.length === 0;
  const score = allMatching ? (rule.actions ?? []).reduce((s, a) => s + (a.weight ?? 0), 0) : 0;

  let actions = allMatching ? [...(rule.actions ?? [])] : [];

  // aggregate scoring: threshold exceeded -> escalate
  if (rule.scoreThreshold != null && score >= rule.scoreThreshold && rule.escalateTo) {
    const escalated: AutomodActions = {
      action: rule.escalateTo as AutomodActions['action'],
      reason: `Score ${score} exceeded threshold ${rule.scoreThreshold}`,
      category: actions[0]?.category,
      weight: score,
      notifyUser: true,
      log: true,
    };
    actions = [escalated];
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    matched: actions.length > 0,
    score,
    actions,
    matchedConditions,
  };
}

/**
 * Run a set of rules against content and produce a single verdict.
 * The most severe matched action wins; reasons/categories are aggregated.
 */
export function evaluateRules(
  rules: AutomodRule[],
  ctx: ContentContext,
): AutomodVerdict {
  const evaluations = rules.map((r) => evaluateRule(r, ctx));

  const matched = evaluations.filter((e) => e.matched);
  if (matched.length === 0) {
    return { action: 'ALLOW', evaluations, reasons: [], categories: [] };
  }

  const best = matched.sort(
    (a, b) => SEVERITY[b.actions[0]?.action ?? 'ALLOW'] - SEVERITY[a.actions[0]?.action ?? 'ALLOW'],
  )[0];

  const reasons = Array.from(
    new Set(best.actions.map((a) => a.reason).filter(Boolean) as string[]),
  );
  const categories = Array.from(
    new Set(best.actions.map((a) => a.category).filter(Boolean) as string[]),
  );
  const action = best.actions[0]?.action ?? 'ALLOW';

  return { action, evaluations, reasons, categories };
}

export function buildContentContext(input: {
  title?: string;
  body?: string;
  type: PostType | 'COMMENT';
  mediaPresent?: boolean;
  mediaType?: 'VIDEO' | 'IMAGE';
  gameNames?: string[];
  platforms?: Platform[];
  authorAgeDays: number;
  authorKarma: number;
  authorNewUser: boolean;
  authorBanned: boolean;
  authorRole: 'USER' | 'MOD' | 'ADMIN';
  nsfwScore?: number;
  spamScore?: number;
}): ContentContext {
  const title = input.title ?? '';
  const body = input.body ?? '';
  return {
    title,
    body,
    text: `${title} ${body}`.trim(),
    type: input.type,
    mediaPresent: Boolean(input.mediaPresent),
    mediaType: input.mediaType,
    gameNames: input.gameNames ?? [],
    platforms: input.platforms ?? [],
    author: {
      ageDays: input.authorAgeDays,
      karma: input.authorKarma,
      newUser: input.authorNewUser,
      banned: input.authorBanned,
      role: input.authorRole,
    },
    nsfwScore: input.nsfwScore,
    spamScore: input.spamScore,
  };
}
