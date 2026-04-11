import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

const router = express.Router();

const redisConnection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

const remindersQueue = new Queue('reminders', { connection: redisConnection });
const reportsQueue  = new Queue('reports',   { connection: redisConnection });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/v1/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(remindersQueue), new BullMQAdapter(reportsQueue)],
  serverAdapter,
});

router.use('/', serverAdapter.getRouter());

export default router;