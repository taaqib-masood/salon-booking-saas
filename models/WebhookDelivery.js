```javascript
import mongoose from 'mongoose';

const WebhookDeliverySchema = new mongoose.Schema({
  webhook: { type: String, required: true },
  tenant: { type: String, required: true },
  event: { type: String, required: true },
  payload: { type: Object, default: {} },
  attempt: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'success', 'failure'], default: 'pending' },
  responseStatus: { type: Number },
  responseBody: { type: Object },
  responseTimeMs: { type: Number },
  error: { type: String },
  nextRetryAt: { type: Date, index: true },
  createdAt: { type: Date, default: Date.now, expires: '1d' } // TTL index on createdAt
});

const WebhookDelivery = mongoose.model('WebhookDelivery', WebhookDeliverySchema);

export default WebhookDelivery;
```