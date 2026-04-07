```javascript
import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { REDIS_URL } = process.env;

class RedisClient {
  constructor() {
    this.redis = new Redis(REDIS_URL, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async get(key) {
    const value = await this.redis.get(key);
    return JSON.parse(value);
  }

  set(key, value, ttl = 3600) {
    // Convert the value to a string before storing it
    const strValue = JSON.stringify(value);
    return this.redis.set(key, strValue, 'EX', ttl);
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
```