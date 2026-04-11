// cache.js — in-memory response caching middleware
// Note: This uses a simple Map; for multi-instance deployments use Redis via ioredis

const cache = new Map();

export const cacheResponse = (ttlSeconds, keyFn) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = keyFn(req);
    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    res.set('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, { data: body, expiresAt: Date.now() + ttlSeconds * 1000 });
      return originalJson(body);
    };

    next();
  };
};

export const cacheInvalidate = (keyFn) => {
  return (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const key = keyFn(req);
      cache.delete(key);
    }
    next();
  };
};