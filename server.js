import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import logger from './utils/logger.js';
import { bullConnection } from './utils/redis.js';
import { startReminderJob } from './cron/reminders.js';
import { startDailySummaryJob } from './cron/dailySummary.js';
import { startBackupJob } from './cron/backup.js';
import './workers/whatsappWorker.js';
import './workers/deadLetterWorker.js';
import './workers/followupWorker.js';

const PORT = process.env.PORT || 3000;

async function start() {
  // ── Redis health check ──────────────────────────────────────────────────────
  try {
    const pong = await bullConnection.ping();
    if (pong === 'PONG') {
      logger.info('[Redis] Connected', { host: process.env.REDIS_URL?.replace(/:([^@]+)@/, ':****@') });
    } else {
      throw new Error(`Unexpected ping response: ${pong}`);
    }
  } catch (err) {
    logger.warn('[Redis] Could not connect — queues/caching unavailable', { error: err.message });
    logger.warn('[Redis] Server continuing in degraded mode');
  }

  // ── HTTP server ─────────────────────────────────────────────────────────────
  const server = app.listen(PORT, () => {
    logger.info(`[Server] Running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
  });

  // ── Cron jobs ───────────────────────────────────────────────────────────────
  startReminderJob();
  logger.info('[Cron] Reminder job started');
  startDailySummaryJob();
  logger.info('[Cron] Daily summary job started');
  startBackupJob();
  logger.info('[Cron] Backup job started (2AM Dubai time)');

  // ── Process error handlers ──────────────────────────────────────────────────
  process.on('unhandledRejection', (err) => {
    logger.error('[Server] Unhandled Rejection', { error: err?.message, stack: err?.stack });
    if (process.env.NODE_ENV === 'production') server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error('[Server] Uncaught Exception', { error: err?.message, stack: err?.stack });
    if (process.env.NODE_ENV === 'production') server.close(() => process.exit(1));
  });
}

start();
