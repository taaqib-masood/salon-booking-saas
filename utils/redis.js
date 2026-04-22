import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const isSecure  = REDIS_URL.startsWith('rediss://');

// ── BullMQ connection ─────────────────────────────────────────────────────────
// BullMQ requires maxRetriesPerRequest: null and enableReadyCheck: false
export const bullConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck:     false,
  tls: isSecure ? {} : undefined,
  retryStrategy: (times) => Math.min(times * 500, 10000),
});

bullConnection.on('connect',  () => console.log('[Redis] BullMQ connection established'));
bullConnection.on('error',    (err) => console.warn('[Redis] BullMQ error (non-fatal):', err.message));

// ── Cache connection ──────────────────────────────────────────────────────────
// Separate client for get/set caching — uses lazyConnect so it won't fail boot
const cacheClient = new IORedis(REDIS_URL, {
  lazyConnect: true,
  tls: isSecure ? {} : undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

cacheClient.on('error', (err) => console.warn('[Redis] Cache error (non-fatal):', err.message));

class RedisCache {
  async get(key) {
    try {
      const value = await cacheClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch { return null; }
  }

  set(key, value, ttl = 3600) {
    try {
      return cacheClient.set(key, JSON.stringify(value), 'EX', ttl);
    } catch { return null; }
  }

  del(key) {
    return cacheClient.del(key);
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await cacheClient.keys(`cache:${pattern}`);
      if (!keys.length) return;
      const pipeline = cacheClient.pipeline();
      keys.forEach((key) => pipeline.del(key));
      return pipeline.exec();
    } catch { return null; }
  }

  async withCache({ key, ttl }, callback) {
    let value = await this.get(`cache:${key}`);
    if (!value) {
      value = await callback();
      await this.set(`cache:${key}`, value, ttl);
    }
    return value;
  }

  // Health check — used by server.js on startup
  async ping() {
    try {
      await cacheClient.connect().catch(() => {});
      const result = await cacheClient.ping();
      return result === 'PONG';
    } catch { return false; }
  }
}

export default new RedisCache();
