```javascript
import Queue from 'bull';
import { createClient } from 'redis';
import mongoose from 'mongoose';

const analyticsQueue = new Queue('analytics', process.env.REDIS_URL);
const redisClient = createClient({ url: process.env.REDIS_URL });

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

analyticsQueue.process('aggregate_daily_revenue', async (job) => {
  // TODO: Implement your logic here to aggregate daily revenue
});

analyticsQueue.process('aggregate_tenant_overview', async (job) => {
  // TODO: Implement your logic here to aggregate tenant overview
});

analyticsQueue.process('invalidate_analytics', async (job) => {
  // TODO: Invalidate cached analytics data in Redis
});
```