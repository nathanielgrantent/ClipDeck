import type { Prisma } from '@prisma/client';
import {
  parseStringArray,
  type Comment,
  type Community,
  type Game,
  type MediaAsset,
  type Me,
  type Notification,
  type Platform,
  type Post,
  type PostStatus,
  type PublicUser,
  type Role,
  type UserStatus,
} from '@gamingclips/shared';

type UserWithRelations = Prisma.UserGetPayload<Record<string, never>> & {
  _count?: Record<string, number>;
};

function roleOf(r: string): Role {
  return (['USER', 'MOD', 'ADMIN'] as Role[]).includes(r as Role)
    ? (r as Role)
    : 'USER';
}

function statusOf(s: string): UserStatus {
  return (['online', 'idle', 'offline'] as UserStatus[]).includes(s as UserStatus)
    ? (s as UserStatus)
    : 'offline';
}

function platformOf(p: string): Platform {
  const valid: Platform[] = ['STEAM', 'PC', 'PS5', 'PS4', 'XBOX', 'SWITCH', 'OTHER'];
  return valid.includes(p as Platform) ? (p as Platform) : 'OTHER';
}

export function serializeUser(
  u: UserWithRelations,
  includeStorage = false,
): PublicUser | Me {
  const base: PublicUser = {
    id: u.id,
    username: u.username,
    avatarUrl: u.image ?? null,
    role: roleOf(u.role),
    status: statusOf(u.status),
    karma: u.karma,
    createdAt: u.createdAt.toISOString(),
    banned: u.banned,
  };
  if (includeStorage) {
    return {
      ...base,
      storageUsedBytes: Number(u.storageUsedBytes),
      storageQuotaBytes: Number(u.storageQuotaBytes),
      email: u.email ?? null,
    };
  }
  return base;
}

type CommunityWithCounts = Prisma.CommunityGetPayload<{
  include: { _count: { select: { subscriptions: true; posts: true } } };
}> & {
  subscribed?: boolean;
  isModerator?: boolean;
  _count?: { subscriptions: number; posts: number };
};

export function serializeCommunity(c: CommunityWithCounts): Community {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    rules: parseStringArray(c.rules),
    avatarUrl: c.avatarUrl,
    bannerUrl: c.bannerUrl,
    ownerId: c.ownerId,
    sfw: c.sfw,
    memberCount: c._count?.subscriptions ?? 0,
    postCount: c._count?.posts ?? 0,
    createdAt: c.createdAt.toISOString(),
    subscribed: c.subscribed,
    isModerator: c.isModerator,
  };
}

export function serializeGame(g: Prisma.GameGetPayload<Record<string, never>>): Game {
  return {
    id: g.id,
    name: g.name,
    platform: platformOf(g.platform),
    coverUrl: g.coverUrl,
    steamAppId: g.steamAppId,
    aliases: parseStringArray(g.aliases),
    popularity: g.popularity,
  };
}

export function serializeMedia(
  m: Prisma.MediaAssetGetPayload<Record<string, never>>,
): MediaAsset {
  return {
    id: m.id,
    type: m.type === 'IMAGE' ? 'IMAGE' : 'VIDEO',
    mime: m.mime,
    sizeBytes: Number(m.sizeBytes),
    width: m.width,
    height: m.height,
    durationSeconds: m.durationSeconds,
    status: (['PROCESSING', 'READY', 'FAILED'] as const).includes(m.status as never)
      ? (m.status as MediaAsset['status'])
      : 'PROCESSING',
    hlsUrl: m.hlsUrl,
    thumbnailUrl: m.thumbnailUrl,
    originalUrl: m.originalUrl,
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeNotification(
  n: Prisma.NotificationGetPayload<Record<string, never>>,
): Notification {
  return {
    id: n.id,
    type: (['REPLY', 'VOTE', 'MENTION', 'MOD_ACTION', 'SYSTEM'] as const).includes(
      n.type as never,
    )
      ? (n.type as Notification['type'])
      : 'SYSTEM',
    title: n.title,
    body: n.body,
    href: n.href,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    author: true;
    community: {
      include: { _count: { select: { subscriptions: true; posts: true } } };
    };
    games: { include: { game: true } };
    media: true;
    _count: { select: { comments: true } };
  };
}> & {
  vote?: 1 | -1 | 0;
};

export function serializePost(p: PostWithRelations): Post {
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    type: p.type === 'IMAGE' ? 'IMAGE' : 'CLIP',
    status: (['VISIBLE', 'FILTERED', 'REMOVED'] as const).includes(p.status as never)
      ? (p.status as Post['status'])
      : 'VISIBLE',
    score: p.score,
    commentCount: p._count?.comments ?? 0,
    author: serializeUser(p.author),
    community: serializeCommunity(p.community as never),
    games: p.games.map((g) => serializeGame(g.game)),
    media: p.media.map(serializeMedia),
    automodReasons: parseStringArray(p.automodReasons),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    vote: p.vote ?? 0,
  };
}

export type CommentNode = Prisma.CommentGetPayload<{
  include: { author: true; _count: { select: { children: true } } };
}> & {
  vote?: 1 | -1 | 0;
  children?: CommentNode[];
};

export function serializeComment(c: CommentNode): Comment {
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    body: c.body,
    score: c.score,
    author: serializeUser(c.author),
    status: (['VISIBLE', 'FILTERED', 'REMOVED'] as const).includes(c.status as never)
      ? (c.status as PostStatus)
      : 'VISIBLE',
    automodReasons: parseStringArray(c.automodReasons),
    createdAt: c.createdAt.toISOString(),
    children: (c.children ?? []).map(serializeComment),
  };
}
