```javascript
import express from 'express';
import { getMetrics } from '../controllers/metricsController.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const token = req.headers['authorization']?.split('Bearer ')[1];
  if (!token || token !== process.env.METRICS_TOKEN) {
    const ip = req.connection.remoteAddress;
    if (ip !== 'private-ip') return res.sendStatus(403); // Replace 'private-ip' with your private IP address
  }
  
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.send(metrics);
  } catch (error) {
    console.error(`Error fetching metrics: ${error}`);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
```