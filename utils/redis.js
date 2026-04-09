import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const { REDIS_URL } = process.env;

class RedisClient {
  constructor() {
    this.redis = new Redis(REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });

    this.redis.on('error', (err) => {
      console.warn('Redis connection error (non-fatal):', err.message);
    });
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  set(key, value, ttl = 3600) {
    try {
      const strValue = JSON.stringify(value);
      return this.redis.set(key, strValue, 'EX', ttl);
    } catch {
      return null;
    }
  }

  del(key) {
    return this.redis.del(key);
  }

  async invalidatePattern(pattern) {
    const keys = await this.redis.keys(`cache:${pattern}`);
    const pipeline = this.redis.pipeline();
    keys.forEach((key) => {
      pipeline.del(key);
    });
    return pipeline.exec();
  }

  async withCache({ key, ttl }, callback) {
    let value = await this.get(`cache:${key}`);
    if (!value) {
      value = await callback();
      await this.set(`cache:${key}`, value, ttl);
    }
    return value;
  }
}

export default new RedisClient();
