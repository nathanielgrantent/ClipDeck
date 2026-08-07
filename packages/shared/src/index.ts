export type Role = 'USER' | 'MOD' | 'ADMIN';
export type UserStatus = 'online' | 'idle' | 'offline';
export type Platform = 'STEAM' | 'PC' | 'PS5' | 'PS4' | 'XBOX' | 'SWITCH' | 'OTHER';

export type PostType = 'CLIP' | 'IMAGE';
export type PostStatus = 'VISIBLE' | 'FILTERED' | 'REMOVED';
export type MediaStatus = 'PROCESSING' | 'READY' | 'FAILED';
export type MediaType = 'VIDEO' | 'IMAGE';

export type ReportTargetType = 'POST' | 'COMMENT';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';

export type ModActionType =
  | 'REMOVE'
  | 'APPROVE'
  | 'FILTER'
  | 'BAN'
  | 'UNBAN'
  | 'REPORT'
  | 'NOTIFY'
  | 'WARN'
  | 'APPEAL';

export type AutomodActionType = 'REMOVE' | 'FILTER' | 'REPORT' | 'NOTIFY';

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB per user
export const MAX_TAGS_PER_POST = 5;
export const MAX_POST_TITLE_LENGTH = 300;
export const MAX_COMMENT_LENGTH = 10000;

// ---------------------------------------------------------------------------
// Automod rule DSL
// ---------------------------------------------------------------------------

export interface AutomodConditions {
  /** Any of these substrings present in title/body (case-insensitive). */
  keywords?: string[];
  /** All of these required (AND) - combined with keywords is additive scoring. */
  requiredKeywords?: string[];
  /** Regex patterns matched against title+body. */
  patterns?: string[];
  /** Link domains blocked (hostname match, e.g. "spam.example"). */
  blockedDomains?: string[];
  /** Link domains allowed - content only containing these is exempt. */
  allowedDomains?: string[];
  /** Post/comment body length limits. */
  minBodyLength?: number;
  maxBodyLength?: number;
  /** Title length limits. */
  minTitleLength?: number;
  maxTitleLength?: number;
  /** Account constraints. */
  minAccountAgeDays?: number;
  maxAccountAgeDays?: number;
  minKarma?: number;
  newUserOnly?: boolean;
  /** Structural signals. */
  requireMedia?: boolean;
  requireImage?: boolean;
  requireVideo?: boolean;
  requireTags?: boolean;
  bannedPlatforms?: Platform[];
  bannedTags?: string[];
  isNSFW?: boolean;
  nsfwScoreAbove?: number;
  spamScoreAbove?: number;
  linkCountAbove?: number;
  capitalizedWordsAbove?: number;
}

export interface AutomodActions {
  /** Primary action: remove content, hold in mod queue, or report only. */
  action: AutomodActionType;
  /** Moderation note attached to the action. */
  reason: string;
  /** Category label surfaced in the mod queue (e.g. SPAM, PROFANITY). */
  category?: string;
  /** Weight contributed toward an aggregate score threshold. */
  weight?: number;
  /** When true, notifies the target user about the action. */
  notifyUser?: boolean;
  /** When true, records a ModLog entry. */
  log?: boolean;
}

export interface AutomodRule {
  id: string;
  name: string;
  /** GLOBAL = site-wide; COMMUNITY = scoped to one community. */
  scope: 'GLOBAL' | 'COMMUNITY';
  communitySlug?: string;
  enabled: boolean;
  priority: number;
  conditions: AutomodConditions;
  actions: AutomodActions[];
  /** Aggregate scoring: if sum of matched action weights exceeds this, escalate. */
  scoreThreshold?: number;
  escalateTo?: AutomodActionType;
  createdAt: string;
  updatedAt: string;
}

export interface AutomodRuleInput {
  name: string;
  scope: 'GLOBAL' | 'COMMUNITY';
  communitySlug?: string;
  enabled?: boolean;
  priority?: number;
  conditions: AutomodConditions;
  actions: AutomodActions[];
  scoreThreshold?: number;
  escalateTo?: AutomodActionType;
}

export interface AutomodEvaluation {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  score: number;
  actions: AutomodActions[];
  matchedConditions: string[];
}

export interface AutomodVerdict {
  action: AutomodActionType | 'ALLOW';
  evaluations: AutomodEvaluation[];
  reasons: string[];
  categories: string[];
}

// ---------------------------------------------------------------------------
// API DTOs
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  karma: number;
  createdAt: string;
  banned: boolean;
}

export interface Me extends PublicUser {
  storageUsedBytes: number;
  storageQuotaBytes: number;
  email: string | null;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string[];
  avatarUrl: string | null;
  bannerUrl: string | null;
  ownerId: string;
  sfw: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  subscribed?: boolean;
  isModerator?: boolean;
}

export interface Game {
  id: string;
  name: string;
  platform: Platform;
  coverUrl: string | null;
  steamAppId: number | null;
  aliases: string[];
  popularity: number;
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  status: MediaStatus;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  originalUrl: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  body: string | null;
  type: PostType;
  status: PostStatus;
  score: number;
  commentCount: number;
  author: PublicUser;
  community: Community;
  games: Game[];
  media: MediaAsset[];
  automodReasons: string[];
  createdAt: string;
  updatedAt: string;
  vote?: 1 | -1 | 0;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  score: number;
  author: PublicUser;
  status: PostStatus;
  automodReasons: string[];
  createdAt: string;
  children: Comment[];
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporter: PublicUser;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  handledBy: PublicUser | null;
}

export interface ModQueueItem {
  id: string;
  kind: 'POST' | 'COMMENT';
  target: Post | Comment;
  rules: string[];
  categories: string[];
  status: PostStatus;
  createdAt: string;
}

export interface ModLogEntry {
  id: string;
  action: ModActionType;
  actor: PublicUser;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'REPLY' | 'VOTE' | 'MENTION' | 'MOD_ACTION' | 'SYSTEM';
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface DesktopRelease {
  version: string;
  platform: string;
  url: string;
  signature: string | null;
  notes: string;
  publishedAt: string;
}

export interface UploadSession {
  id: string;
  uploadUrl: string;
  assetId: string;
  mediaType: MediaType;
  maxBytes: number;
}

export interface CreatePostInput {
  communitySlug: string;
  title: string;
  body?: string;
  type: PostType;
  assetId: string;
  gameIds: string[];
}

export interface CreateCommentInput {
  postId: string;
  body: string;
  parentId?: string | null;
}

// ---------------------------------------------------------------------------
// Small helpers shared across client/server
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// String-encoded JSON helpers (SQLite-native storage for lists/objects)
// ---------------------------------------------------------------------------

export function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function serializeStringArray(value: string[]): string {
  return JSON.stringify(value ?? []);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function serializeJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
