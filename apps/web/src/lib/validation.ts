import { z } from 'zod';
import { MAX_COMMENT_LENGTH, MAX_POST_TITLE_LENGTH, MAX_TAGS_PER_POST } from '@gamingclips/shared';

const cuid = z.string().cuid();

export const createCommunitySchema = z.object({
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(4000).default(''),
  rules: z.array(z.string().max(500)).max(20).default([]),
});

export const createPostSchema = z.object({
  communitySlug: z.string().min(1),
  title: z.string().trim().min(1).max(MAX_POST_TITLE_LENGTH),
  body: z.string().max(40000).optional().default(''),
  type: z.enum(['CLIP', 'IMAGE']),
  assetId: cuid,
  gameIds: z.array(cuid).max(MAX_TAGS_PER_POST).default([]),
});

export const createCommentSchema = z.object({
  postId: cuid,
  body: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
  parentId: cuid.optional().nullable(),
});

export const voteSchema = z.object({
  postId: cuid,
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const reportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT']),
  targetId: cuid,
  reason: z.string().trim().min(3).max(1000),
});

export const modActionSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'USER']),
  targetId: cuid,
  action: z.enum(['REMOVE', 'APPROVE', 'BAN', 'UNBAN', 'WARN', 'NOTIFY']),
  reason: z.string().max(1000).optional().default(''),
});

export const automodRuleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  scope: z.enum(['GLOBAL', 'COMMUNITY']),
  communitySlug: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).max(1000).default(100),
  conditions: z.record(z.unknown()).default({}),
  actions: z.array(z.record(z.unknown())).min(1),
  scoreThreshold: z.number().min(0).optional(),
  escalateTo: z.string().optional(),
});

export const updateProfileSchema = z.object({
  username: z.string().trim().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().url().optional(),
});
