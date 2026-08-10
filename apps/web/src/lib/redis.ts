import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

function createRedis(): Redis {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    lazyConnect: true,
    // Give up after ~30s so queue.add() fails fast when Redis is down
    // instead of queuing jobs indefinitely.
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 1000, 5000)),
  });

  client.on('error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[redis] connection error:', err.message);
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

// Connect lazily - don't block startup if Redis is temporarily unavailable
redis.connect().catch(() => {});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
