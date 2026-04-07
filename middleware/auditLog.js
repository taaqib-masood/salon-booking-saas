```javascript
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  action: String,
  targetId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model('AuditLog', schema);

const SENSITIVE_FIELDS = ['password'];

function sanitize(obj) {
  for (let key in obj) {
    if (SENSITIVE_FIELDS.includes(key)) delete obj[key];
    else if (typeof obj[key] === 'object') sanitize(obj[key]);
  }
}

export function audit(action, getTarget) {
  return async (req, res, next) => {
    try {
      const targetId = await getTarget(req);
      if (!targetId) throw new Error('No target ID');
      
      sanitize(req.body);
      sanitize(req.query);
      sanitize(req.params);

      await AuditLog.create({
        action,
        targetId,
        userId: req.user?._id || null,
      });
      
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function createSystemAuditLog(action, targetId, userId = null) {
  return AuditLog.create({ action, targetId, userId });
}
```