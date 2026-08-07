import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    // Give up after ~30s so queue.add() fails fast when Redis is down
    // instead of queuing jobs indefinitely.
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 1000, 5000)),
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
