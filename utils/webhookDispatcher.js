```javascript
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Webhook } from '../models/webhook.js';

const MAX_RETRIES = 5;

function generateSignature(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function deliverWebhook(url, secret, payload, retryCount = 0) {
  const signature = generateSignature(secret, JSON.stringify(payload));
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      return deliverWebhook(url, secret, payload, retryCount + 1);
    } else {
      throw error;
    }
  }
}

export async function dispatchEvent(eventName, eventPayload) {
  const activeWebhooks = await Webhook.find({ event: eventName, isActive: true });
  for (const webhook of activeWebhooks) {
    deliverWebhook(webhook.url, webhook.secret, eventPayload);
  }
}
```