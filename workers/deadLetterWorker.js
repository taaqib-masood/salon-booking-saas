import { Worker } from 'bullmq';
import { bullConnection } from '../utils/redis.js';
import { supabase } from '../lib/supabase.js';
import { createLogger, maskPhone } from '../utils/logger.js';

const log = createLogger('DLQ');

const worker = new Worker('dead-letter', async (job) => {
  const { originalQueue, jobName, jobData, error, failedAt } = job.data;

  log.error('Permanently failed job entered dead-letter queue', {
    originalQueue,
    jobName,
    failedAt,
    error,
    phone: maskPhone(jobData?.phoneNumber),
    notificationId: jobData?.notificationId,
  });

  // Persist to Supabase for debugging / manual retry
  if (jobData?.notificationId) {
    await supabase
      .from('notifications')
      .update({
        status:        'dead_letter',
        error_message: `[DLQ] ${error} (queue: ${originalQueue})`,
      })
      .eq('id', jobData.notificationId)
      .catch((e) => log.warn('Could not update notification status in DLQ', { error: e.message }));
  }
}, { connection: bullConnection, concurrency: 1 });

worker.on('completed', (job) => {
  log.info('DLQ job logged', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  // DLQ itself failed — just log, no further retry to avoid infinite loops
  log.error('DLQ worker failed to process job', { jobId: job?.id, error: err.message });
});

log.info('Dead Letter Worker started');

export default worker;
