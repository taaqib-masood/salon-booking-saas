```javascript
import NodeCache from 'node-cache';

const cache = new NodeCache();

export const cacheResponse = (ttlSeconds, keyFn) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      const key = keyFn(req);
      const cachedBody = cache.get(key);
      
      if (cachedBody) {
        res.set('X-Cache', 'HIT');
        return res.send(JSON.parse(cachedBody));
      } else {
        res.set('X-Cache', 'MISS');
        
        const send = res.send;
        res.send = (body) => {
          cache.set(key, JSON.stringify(body), ttlSeconds);
          send.call(res, body);
        };
      }
    }
    
    next();
  };
};

export const cacheInvalidate = (keyFn) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      const key = keyFn(req);
      cache.del(key);
    }
    
    next();
  };
};
```