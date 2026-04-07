```javascript
import express from 'express';
import Queue from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const router = express.Router();

// Assuming you have a redis instance running on localhost:6379
const queue1 = new Queue('queue1', 'redis://localhost:6379');
const queue2 = new Queue('queue2', 'redis://localhost:6379');

// Create bull-board UI
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues/board');
createBullBoard({
  queues: [new BullAdapter(queue1), new BullAdapter(queue2)],
  serverAdapter,
});

// Mount bull-board UI at /admin/queues/board
router.use('/admin/queues/board', serverAdapter.getRouter());

// GET /admin/queues returns queue stats
router.get('/admin/queues', async (req, res) => {
  const queue1Stats = await queue1.getJobCounts();
  const queue2Stats = await queue2.getJobCounts();
  res.json({ queue1: queue1Stats, queue2: queue2Stats });
});

// GET /admin/queues/:queueName/failed returns failed jobs
router.get('/admin/queues/:queueName/failed', async (req, res) => {
  const { queueName } = req.params;
  if (!['queue1', 'queue2'].includes(queueName)) return res.status(404).json({ error: 'Queue not found' });
  const failedJobs = await Queue[queueName].getFailed();
  res.json(failedJobs);
});

// POST to retry or clean
router.post('/admin/queues/:queueName/retry', async (req, res) => {
  const { queueName } = req.params;
  if (!['queue1', 'queue2'].includes(queueName)) return res.status(404).json({ error: 'Queue not found' });
  await Queue[queueName].retry();
  res.sendStatus(200);
});

router.post('/admin/queues/:queueName/clean', async (req, res) => {
  const { queueName } = req.params;
  if (!['queue1', 'queue2'].includes(queueName)) return res.status(404).json({ error: 'Queue not found' });
  await Queue[queueName].clean();
  res.sendStatus(200);
});

export default router;
```