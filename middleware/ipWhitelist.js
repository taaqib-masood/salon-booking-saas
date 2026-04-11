import dotenv from 'dotenv';
import { supabase } from '../lib/supabase.js';

dotenv.config();

const ADMIN_IP_WHITELIST = (process.env.ADMIN_IP_WHITELIST || '127.0.0.1').split(',').map(ip => ip.trim());

function isPrivateIp(ip) {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export default function ipWhitelistMiddleware(req, res, next) {
  const clientIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

  if (isPrivateIp(clientIp) || ADMIN_IP_WHITELIST.includes(clientIp)) {
    return next();
  }

  // Log the blocked attempt to Supabase (fire-and-forget)
  supabase.from('audit_logs').insert({
    action: 'IP_BLOCKED',
    meta: { ip: clientIp, path: req.path },
  }).then();

  res.status(403).json({ error: 'Forbidden: IP not whitelisted' });
}