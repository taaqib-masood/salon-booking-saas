```javascript
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    action: { type: String, required: true },
    actorType: { type: String, required: true },
    actorId: { type: String, required: true },
    tenantId: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    requestId: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

auditLogSchema.index({createdAt: 1},{expireAfterSeconds: 7776000}); // 90 days in seconds

// Disable updates and deletes
auditLogSchema.pre('updateOne', function(next) {
    next(new Error("Update is not allowed on Audit Log"));
});
auditLogSchema.pre('findOneAndUpdate', function(next) {
    next(new Error("Update is not allowed on Audit Log"));
});
auditLogSchema.pre('save', function(next) {
    next(new Error("Save is not allowed on Audit Log"));
});
auditLogSchema.post('remove', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 16430) {
        next();
    } else {
        next(error);
    }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
```