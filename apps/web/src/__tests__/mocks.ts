import { vi } from 'vitest';

export { vi };

// --- Prisma mock ---
const prismaMock = {
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  comment: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  community: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  mediaAsset: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  vote: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  subscription: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  automodRule: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  modQueueItem: {
    create: vi.fn(),
  },
  modLog: {
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn(async (fn: any) => fn(prismaMock)),
};

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

// --- Auth mock ---
const authMock = vi.fn();
vi.mock('@/auth', () => ({ auth: authMock }));

// --- Moderators mock ---
vi.mock('@/lib/moderators', () => ({
  isBanned: vi.fn().mockResolvedValue(false),
  isSiteAdmin: vi.fn().mockResolvedValue(false),
  isCommunityModerator: vi.fn().mockResolvedValue(false),
  canModerate: vi.fn().mockResolvedValue(false),
}));

// --- Moderation mock ---
// NOTE: Not mocking @/lib/moderation so tests can use real implementation with mocked Prisma
// vi.mock('@/lib/moderation', () => ({
//   loadRules: vi.fn().mockResolvedValue([]),
//   applyVerdict: vi.fn().mockResolvedValue({ status: 'VISIBLE' }),
//   logAction: vi.fn(),
//   notifyUser: vi.fn(),
// }));

// --- Serializers mock ---
vi.mock('@/lib/serializers', () => ({
  serializePost: vi.fn((p) => ({
    ...p,
    commentCount: p._count?.comments ?? 0,
    createdAt: p.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: p.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  })),
  serializeComment: vi.fn((c) => ({
    ...c,
    createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
  })),
  serializeCommunity: vi.fn((c) => ({
    ...c,
    memberCount: c._count?.subscriptions ?? 0,
    postCount: c._count?.posts ?? 0,
    createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
  })),
}));

// --- Automod mock ---
vi.mock('@/lib/automod', () => ({
  buildContentContext: vi.fn(() => ({})),
  evaluateRules: vi.fn(() => ({
    action: 'ALLOW',
    evaluations: [],
    reasons: [],
    categories: [],
  })),
  extractDomains: vi.fn(() => []),
  countLinks: vi.fn(() => 0),
  countCapitalizedWords: vi.fn(() => 0),
  normalize: vi.fn((s: string) => s.toLowerCase().trim()),
}));

// --- Shared mock ---
vi.mock('@gamingclips/shared', async () => {
  const actual = await vi.importActual<typeof import('@gamingclips/shared')>('@gamingclips/shared');
  return {
    ...actual,
    slugify: (v: string) =>
      v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60),
    serializeStringArray: (v: string[]) => JSON.stringify(v ?? []),
    parseJson: <T>(v: string | null | undefined, fallback: T): T => {
      if (!v) return fallback;
      try { return JSON.parse(v) as T; } catch { return fallback; }
    },
  };
});

export { prismaMock, authMock };
