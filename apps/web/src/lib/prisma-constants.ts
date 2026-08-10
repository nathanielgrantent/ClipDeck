/** Shared Prisma include objects used across API routes. */
export const POST_INCLUDE = {
  author: true,
  community: { include: { _count: { select: { subscriptions: true, posts: true } } } },
  games: { include: { game: true } },
  media: true,
  _count: { select: { comments: true } },
} as const;

export const COMMENT_INCLUDE = {
  author: true,
  _count: { select: { children: true } },
} as const;
