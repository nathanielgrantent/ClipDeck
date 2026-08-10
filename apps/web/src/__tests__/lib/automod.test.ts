import { describe, it, expect, vi } from 'vitest';
import type { AutomodRule } from '@gamingclips/shared';

const mockRuleBase: Omit<AutomodRule, 'id' | 'name' | 'conditions' | 'actions'> = {
  scope: 'GLOBAL',
  enabled: true,
  priority: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('automod - extractDomains', () => {
  it('extracts domain from URL', async () => {
    const { extractDomains } = await import('@/lib/automod');
    expect(extractDomains('Visit https://example.com/page')).toEqual(['example.com']);
  });

  it('extracts multiple domains', async () => {
    const { extractDomains } = await import('@/lib/automod');
    const result = extractDomains('Go to https://a.com and http://b.org/path');
    expect(result).toContain('a.com');
    expect(result).toContain('b.org');
  });

  it('strips www prefix', async () => {
    const { extractDomains } = await import('@/lib/automod');
    expect(extractDomains('https://www.example.com')).toEqual(['example.com']);
  });

  it('returns empty for no URLs', async () => {
    const { extractDomains } = await import('@/lib/automod');
    expect(extractDomains('No links here')).toEqual([]);
  });
});

describe('automod - countLinks', () => {
  it('counts links in text', async () => {
    const { countLinks } = await import('@/lib/automod');
    expect(countLinks('Visit https://a.com and http://b.org')).toBe(2);
  });

  it('returns 0 for no links', async () => {
    const { countLinks } = await import('@/lib/automod');
    expect(countLinks('No links')).toBe(0);
  });
});

describe('automod - countCapitalizedWords', () => {
  it('counts fully capitalized words of 4+ letters', async () => {
    const { countCapitalizedWords } = await import('@/lib/automod');
    expect(countCapitalizedWords('THIS IS A TEST with some words')).toBe(2);
  });

  it('ignores short uppercase words', async () => {
    const { countCapitalizedWords } = await import('@/lib/automod');
    expect(countCapitalizedWords('OK hi LOL')).toBe(0);
  });
});

describe('automod - evaluateRules', () => {
  it('returns ALLOW when no rules match', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const ctx = buildContentContext({
      title: 'Hello',
      body: 'World',
      type: 'CLIP',
      authorAgeDays: 30,
      authorKarma: 50,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules([], ctx);
    expect(result.action).toBe('ALLOW');
    expect(result.reasons).toEqual([]);
  });

  it('returns REMOVE when a rule matches with REMOVE action', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'Banned keyword',
        conditions: { keywords: ['spam'] },
        actions: [{ action: 'REMOVE' as const, reason: 'Spam detected', category: 'SPAM', weight: 10 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Check this spam link',
      body: 'Buy now!',
      type: 'CLIP',
      authorAgeDays: 1,
      authorKarma: 0,
      authorNewUser: true,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('REMOVE');
    expect(result.reasons).toContain('Spam detected');
  });

  it('returns FILTER when rule matches with FILTER action', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'New user check',
        priority: 50,
        conditions: { newUserOnly: true },
        actions: [{ action: 'FILTER' as const, reason: 'New user content', category: 'NEW_USER', weight: 5 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Hello',
      body: 'World',
      type: 'CLIP',
      authorAgeDays: 0,
      authorKarma: 0,
      authorNewUser: true,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('FILTER');
  });

  it('skips disabled rules', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'Disabled rule',
        enabled: false,
        conditions: { keywords: ['test'] },
        actions: [{ action: 'REMOVE' as const, reason: 'Should not fire', category: 'SPAM', weight: 10 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Test post',
      body: '',
      type: 'CLIP',
      authorAgeDays: 30,
      authorKarma: 50,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('ALLOW');
  });

  it('matches blocked domains', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'Block spam domains',
        conditions: { blockedDomains: ['spam.com'] },
        actions: [{ action: 'FILTER' as const, reason: 'Blocked domain', category: 'SPAM', weight: 10 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Check this out',
      body: 'Visit https://spam.com/deals',
      type: 'CLIP',
      authorAgeDays: 30,
      authorKarma: 50,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('FILTER');
  });

  it('matches requiredKeywords', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'LFG filter',
        conditions: { requiredKeywords: ['looking', 'group'] },
        actions: [{ action: 'FILTER' as const, reason: 'LFG post', category: 'LFG', weight: 5 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'LFG for raid',
      body: 'Looking for a group to do the raid tonight',
      type: 'CLIP',
      authorAgeDays: 10,
      authorKarma: 20,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('FILTER');
  });

  it('matches minAccountAgeDays', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'New account check',
        conditions: { minAccountAgeDays: 7 },
        actions: [{ action: 'REPORT' as const, reason: 'New account', category: 'NEW_ACCOUNT', weight: 3 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Hello world',
      body: 'First post here',
      type: 'CLIP',
      authorAgeDays: 2,
      authorKarma: 0,
      authorNewUser: true,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('REPORT');
  });

  it('matches bannedTags', async () => {
    const { evaluateRules, buildContentContext } = await import('@/lib/automod');
    const rules: AutomodRule[] = [
      {
        ...mockRuleBase,
        id: 'r1',
        name: 'Banned game',
        conditions: { bannedTags: ['Fortnite'] },
        actions: [{ action: 'REMOVE' as const, reason: 'Banned game tag', category: 'BANNED_GAME', weight: 10 }],
      },
    ];
    const ctx = buildContentContext({
      title: 'Check my Fortnite clip',
      body: '',
      type: 'CLIP',
      gameNames: ['Fortnite'],
      authorAgeDays: 30,
      authorKarma: 50,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
    });
    const result = evaluateRules(rules, ctx);
    expect(result.action).toBe('REMOVE');
  });
});

describe('automod - buildContentContext', () => {
  it('builds context from input', async () => {
    const { buildContentContext } = await import('@/lib/automod');
    const ctx = buildContentContext({
      title: 'Test Title',
      body: 'Test Body',
      type: 'CLIP',
      mediaPresent: true,
      mediaType: 'VIDEO',
      gameNames: ['Valorant'],
      platforms: ['PC'],
      authorAgeDays: 100,
      authorKarma: 250,
      authorNewUser: false,
      authorBanned: false,
      authorRole: 'USER',
      nsfwScore: 0.1,
      spamScore: 0.2,
    });

    expect(ctx.title).toBe('Test Title');
    expect(ctx.body).toBe('Test Body');
    expect(ctx.text).toBe('Test Title Test Body');
    expect(ctx.type).toBe('CLIP');
    expect(ctx.mediaPresent).toBe(true);
    expect(ctx.mediaType).toBe('VIDEO');
    expect(ctx.gameNames).toEqual(['Valorant']);
    expect(ctx.platforms).toEqual(['PC']);
    expect(ctx.author.ageDays).toBe(100);
    expect(ctx.author.karma).toBe(250);
    expect(ctx.nsfwScore).toBe(0.1);
    expect(ctx.spamScore).toBe(0.2);
  });
});
