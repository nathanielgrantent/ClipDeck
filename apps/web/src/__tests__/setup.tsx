import '@testing-library/jest-dom/vitest';

// Mock ioredis to prevent connection attempts during tests
class MockRedis {
  on = vi.fn();
  connect = vi.fn().mockResolvedValue(undefined);
  quit = vi.fn().mockResolvedValue(undefined);
  get = vi.fn().mockResolvedValue(null);
  set = vi.fn().mockResolvedValue('OK');
  del = vi.fn().mockResolvedValue(1);
  exists = vi.fn().mockResolvedValue(0);
  expire = vi.fn().mockResolvedValue(1);
  incr = vi.fn().mockResolvedValue(1);
  decr = vi.fn().mockResolvedValue(1);
  hset = vi.fn().mockResolvedValue(1);
  hget = vi.fn().mockResolvedValue(null);
  hgetall = vi.fn().mockResolvedValue({});
  lpush = vi.fn().mockResolvedValue(1);
  rpop = vi.fn().mockResolvedValue(null);
  zadd = vi.fn().mockResolvedValue(1);
  zrange = vi.fn().mockResolvedValue([]);
  zrem = vi.fn().mockResolvedValue(1);
  ping = vi.fn().mockResolvedValue('PONG');
}

vi.mock('ioredis', () => ({
  default: MockRedis,
}));
