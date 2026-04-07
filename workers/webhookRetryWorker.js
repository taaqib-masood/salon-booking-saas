```javascript
import { Queue } from 'bullmq';
import mongoose from 'mongoose';
import WebhookDeliveryModel from '../models/webhook-delivery.js';
import WebhookModel from '../models/webhook.js';

const webhookRetryQueue = new Queue('webhookRetry', { connection: mongoose.connection });

webhookRetryQueue.add('retry_webhook', job => {
  const { webhookId, deliveryId } = job.data;
  
  return Promise.all([
    WebhookModel.findById(webhookId),
    WebhookDeliveryModel.findById(deliveryId)
  ]).then(([webhook, delivery]) => {
    if (!webhook || !delivery) throw new Error('Webhook or Delivery not found');
    
    return deliverWebhook(webhook, delivery);
  }).catch(error => {
    console.log(`Error processing job ${job.id}: ${error}`);
    throw error;
  });
});

async function deliverWebhook(webhook, delivery) {
  // Implement your webhook delivery logic here
  const success = true; // Replace with actual implementation
  
  if (success) {
    await WebhookDeliveryModel.updateOne({ _id: delivery._id }, { $set: { status: 'delivered' } });
    
    return Promise.all([
      WebhookModel.updateOne({ _id: webhook._id }, { $inc: { total_successful_webhooks: 1 } }),
      WebhookDeliveryModel.deleteMany({ webhook_id: webhook._id, status: 'failed' })
    ]);
  } else {
    const newAttemptCount = delivery.attempt_count + 1;
    
    if (newAttemptCount >= webhook.max_attempts) {
      await WebhookDeliveryModel.updateOne({ _id: delivery._id }, { $set: { status: 'permanently_failed' } });
      
      return Promise.all([
        WebhookModel.updateOne({ _id: webhook._id }, { $inc: { total_failed_webhooks: 1 } }),
        WebhookDeliveryModel.deleteMany({ webhook_id: webhook._id, status: 'failed' })
      ]);
    } else {
      return WebhookDeliveryModel.updateOne(
        { _id: delivery._id },
        { $set: { attempt_count: newAttemptCount, next_attempt_at: calculateNextAttemptTime() } }
      );
    }
  }
}

function calculateNextAttemptTime() {
  // Implement your logic to calculate the next retry time here
  return Date.now();
}
```