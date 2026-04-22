import { Worker } from 'bullmq';
import { bullConnection } from '../utils/redis.js';
import { deadLetterQueue } from '../utils/queue.js';
import { sendBookingConfirmation, sendReminder, sendCancellation } from '../utils/whatsapp.js';
import { supabase } from '../lib/supabase.js';
import { createLogger, maskPhone } from '../utils/logger.js';

const log = createLogger('WhatsAppWorker');

const worker = new Worker('whatsapp', async (job) => {
  const { notificationId, phoneNumber, message } = job.data;
  const attempt = job.attemptsMade + 1;

  log.info('Processing job', {
    jobName:        job.name,
    jobId:          job.id,
    attempt,
    maxAttempts:    job.opts.attempts,
    phone:          maskPhone(phoneNumber),
    notificationId,
  });

  switch (job.name) {
    case 'send_confirmation':
      await sendBookingConfirmation(phoneNumber, message);
      break;
    case 'send_reminder':
      await sendReminder(phoneNumber, message);
      break;
    case 'send_cancellation':
      await sendCancellation(phoneNumber, message);
      break;
    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }

  if (notificationId) {
    await supabase
      .from('notifications')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', notificationId);
  }
}, {
  connection: bullConnection,
  concurrency: 3,
});

worker.on('completed', (job) => {
  log.info('Job completed', { jobName: job.name, jobId: job.id });
});

worker.on('failed', async (job, err) => {
  const isFinal = job.attemptsMade >= job.opts.attempts;

  log.error('Job failed', {
    jobName:     job.name,
    jobId:       job.id,
    attempt:     job.attemptsMade,
    maxAttempts: job.opts.attempts,
    isFinal,
    error:       err.message,
    phone:       maskPhone(job.data?.phoneNumber),
  });

  if (job.data.notificationId) {
    await supabase
      .from('notifications')
      .update({ status: isFinal ? 'failed' : 'retrying', error_message: err.message })
      .eq('id', job.data.notificationId)
      .catch(() => {});
  }

  if (isFinal) {
    await deadLetterQueue.add('whatsapp-dlq', {
      originalQueue: 'whatsapp',
      jobName:       job.name,
      jobData:       job.data,
      error:         err.message,
      failedAt:      new Date().toISOString(),
    }).catch((e) => log.error('Failed to enqueue DLQ job', { error: e.message }));
  }
});

log.info('Worker started — listening on Redis');

export default worker;
