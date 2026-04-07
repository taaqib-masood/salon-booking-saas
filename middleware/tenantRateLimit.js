```javascript
import express from 'express';
import RateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

export const createTenantRateLimit = ({ windowMs = 15 * 60 * 1000, max = 100 }) => {
  return new RateLimit({
    store: new RedisStore({
      client,
      expiry: windowMs / 1000,
    }),
    windowMs,
    max,
    keyGenerator: (req) => req.tenantId,
    handler: (_, res) => {
      res.status(429).json({ message: 'Too many requests, please try again later.' });
    },
  });
};

export const apiRateLimit = createTenantRateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
export const bookingRateLimit = createTenantRateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 3 });
export const authRateLimit = createTenantRateLimit({ windowMs: 5 * 60 * 1000, max: 5 });
```