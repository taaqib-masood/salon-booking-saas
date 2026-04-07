```javascript
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const severityToEmojiAndColor = {
  critical: { emoji: ':bangbang:', color: '#FF0000' },
  error: { emoji: ':exclamation:', color: '#FFA500' },
  warning: { emoji: ':warning:', color: '#FFFF00' },
  info: { emoji: ':information_source:', color: '#1E90FF' }
};

const debounceMap = new Map();

function sendSlackAlert(severity, message) {
  const { emoji, color } = severityToEmojiAndColor[severity];
  
  fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attachments: [{
        color,
        text: `${emoji} ${message}`
      }]
    })
  });
}

function alertCriticalError(error) {
  sendSlackAlert('critical', error.stack || error);
}

function alertSlowQuery(query, duration) {
  const key = `slow_query:${query}`;
  
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key));
  }
  
  debounceMap.set(key, setTimeout(() => {
    sendSlackAlert('warning', `Slow query detected: ${query} took ${duration}ms`);
    debounceMap.delete(key);
  }, 10 * 60 * 1000)); // Debounce for 10 minutes
}

export { sendSlackAlert, alertCriticalError, alertSlowQuery };
```