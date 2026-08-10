import { redis } from '@/lib/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sliding-window rate limiter backed by Redis sorted sets.
 * Fails open if Redis is unavailable so legitimate traffic is never blocked
 * by an infrastructure outage.
 */
export async function rateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<RateLimitResult> {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    const unique = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now, unique);
    multi.zcard(key);
    multi.pexpire(key, windowMs);

    const results = await multi.exec();
    const count = (results?.[2]?.[1] as number) ?? 0;

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetAt: now + windowMs,
    };
  } catch {
    // Redis down – fail open.
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }
}

/** Build standard rate-limit response headers. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
