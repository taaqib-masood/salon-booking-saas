```javascript
import express from 'express';
import os from 'os';
import mongoose from 'mongoose';
// import redisClient from './redis.js'; // Uncomment if using Redis
const router = express.Router();

router.get('/health', (req, res) => {
  const uptime = process.uptime();
  const timestamp = Date.now();
  res.status(200).json({ status: 'ok', uptime, timestamp });
});

router.get('/ready', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    // if using Redis, uncomment below line
    // const redisPing = util.promisify(redisClient.ping).bind(redisClient);
    // await redisPing();
    res.status(200).send('Ready');
  } catch (err) {
    console.error(err);
    res.status(503).send('Not Ready');
  }
});

router.get('/health/version', (req, res) => {
  const packageInfo = require('../../package.json');
  res.status(200).json({ version: packageInfo.version });
});

export default router;
```