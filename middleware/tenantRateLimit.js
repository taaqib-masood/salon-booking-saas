import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'ioredis';

let redisClient;
try {
  redisClient = new createClient(process.env.REDIS_URL || 'redis://localhost:6379');
} catch {
  // If Redis is unavailable, fall back to memory store (rate-limit will still work)
  redisClient = null;
}

const makeStore = () => {
  if (!redisClient) return undefined; // use default MemoryStore
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  });
};

export const createTenantRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100 } = {}) => {
  return rateLimit({
    store: makeStore(),
    windowMs,
    max,
    keyGenerator: (req) => req.staff?.tenant_id || req.ip,
    handler: (_, res) => {
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const apiRateLimit     = createTenantRateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
export const bookingRateLimit = createTenantRateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 30 });
export const authRateLimit    = createTenantRateLimit({ windowMs: 5 * 60 * 1000, max: 10 });