import { supabase } from '../lib/supabase.js';

const SENSITIVE_FIELDS = ['password', 'password_hash', 'token'];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) delete obj[key];
    else if (typeof obj[key] === 'object') sanitize(obj[key]);
  }
}

export function audit(action, getTarget) {
  return async (req, res, next) => {
    try {
      const targetId = await getTarget(req);
      sanitize(req.body);

      // Fire-and-forget to Supabase audit_logs table
      supabase.from('audit_logs').insert({
        action,
        target_id: targetId || null,
        user_id: req.staff?.id || null,
        tenant_id: req.staff?.tenant_id || null,
        ip: req.ip,
        meta: req.body,
      }).then(({ error }) => {
        if (error) console.warn('Audit log failed:', error.message);
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function createSystemAuditLog(action, targetId, userId = null, tenantId = null) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({ action, target_id: targetId, user_id: userId, tenant_id: tenantId });
  if (error) console.warn('System audit log failed:', error.message);
}