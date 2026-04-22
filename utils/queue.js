import { Queue } from 'bullmq';
import { bullConnection } from './redis.js';

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s, 25s, 125s, 625s, ~52min
  },
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 500 },
};

export const emailQueue       = new Queue('email',         { connection: bullConnection, defaultJobOptions });
export const whatsappQueue    = new Queue('whatsapp',      { connection: bullConnection, defaultJobOptions });
export const webhookRetryQueue= new Queue('webhook-retry', { connection: bullConnection, defaultJobOptions });
export const reportQueue      = new Queue('report',        { connection: bullConnection, defaultJobOptions });
export const analyticsQueue   = new Queue('analytics',     { connection: bullConnection, defaultJobOptions });
export const followupQueue    = new Queue('followup',      {
  connection: bullConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnComplete: true, removeOnFail: { count: 100 } },
});

// Dead Letter Queue — permanently failed jobs end up here
export const deadLetterQueue  = new Queue('dead-letter',   {
  connection: bullConnection,
  defaultJobOptions: { attempts: 1, removeOnFail: { count: 1000 } },
});

export async function addToQueue(queueName, jobName, data) {
  switch (queueName) {
    case 'email':         return emailQueue.add(jobName, data);
    case 'whatsapp':      return whatsappQueue.add(jobName, data);
    case 'webhook-retry': return webhookRetryQueue.add(jobName, data);
    case 'report':        return reportQueue.add(jobName, data);
    case 'analytics':     return analyticsQueue.add(jobName, data);
    default: throw new Error(`Unknown queue: ${queueName}`);
  }
}

export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    whatsappQueue.close(),
    webhookRetryQueue.close(),
    reportQueue.close(),
    analyticsQueue.close(),
    followupQueue.close(),
    deadLetterQueue.close(),
  ]);
}
