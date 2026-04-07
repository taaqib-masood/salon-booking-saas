```javascript
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});

const defaultJobOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 1000 * 60 * 5, // 5 minutes
    },
};

export const emailQueue = new Queue('email', { connection: redisConnection, defaultJobOptions });
export const whatsappQueue = new Queue('whatsapp', { connection: redisConnection, defaultJobOptions });
export const webhookRetryQueue = new Queue('webhook-retry', { connection: redisConnection, defaultJobOptions });
export const reportQueue = new Queue('report', { connection: redisConnection, defaultJobOptions });
export const analyticsQueue = new Queue('analytics', { connection: redisConnection, defaultJobOptions });

export async function addToQueue(queueName, data) {
    switch (queueName) {
        case 'email':
            await emailQueue.add(queueName, data);
            break;
        case 'whatsapp':
            await whatsappQueue.add(queueName, data);
            break;
        case 'webhook-retry':
            await webhookRetryQueue.add(queueName, data);
            break;
        case 'report':
            await reportQueue.add(queueName, data);
            break;
        case 'analytics':
            await analyticsQueue.add(queueName, data);
            break;
        default:
            throw new Error('Invalid queue name');
    }
}

export async function closeQueues() {
    await Promise.all([
        emailQueue.close(),
        whatsappQueue.close(),
        webhookRetryQueue.close(),
        reportQueue.close(),
        analyticsQueue.close(),
    ]);
}
```