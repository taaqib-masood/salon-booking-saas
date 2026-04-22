import morgan from 'morgan';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

// ── Attach a unique requestId to every request ────────────────────────────────
export function requestId(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

// ── Morgan HTTP request logger ────────────────────────────────────────────────
// Skips health-check endpoints to avoid log noise
const skip = (req) => req.path === '/health' || req.path === '/ping';

export const httpLogger = morgan(
  (tokens, req, res) => {
    const status = tokens.status(req, res);
    const ms     = tokens['response-time'](req, res);
    // Mask any phone-like query params
    const url    = (tokens.url(req, res) || '').replace(/phone=[^&]+/, 'phone=****');
    return JSON.stringify({
      type:       'http',
      requestId:  req.requestId,
      method:     tokens.method(req, res),
      url,
      status:     status ? Number(status) : 0,
      ms:         ms ? Number(ms) : 0,
      ip:         tokens['remote-addr'](req, res),
      ua:         tokens['user-agent'](req, res),
    });
  },
  { stream: logger.stream, skip }
);
