```javascript
import mongoose from 'mongoose';
import crypto from 'crypto';

const webhookSchema = new mongoose.Schema({
  tenant: { type: String, required: true },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https:\/\//.test(v);
      },
      message: props => `${props.value} is not a valid HTTPS URL`
    }
  },
  secret: { type: String, select: false },
  events: [String],
  isActive: Boolean,
  stats: Object,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

webhookSchema.pre('save', function(next) {
  if (!this.secret) {
    this.secret = crypto.randomBytes(16).toString('hex');
  }
  next();
});

export default mongoose.model('Webhook', webhookSchema);
```