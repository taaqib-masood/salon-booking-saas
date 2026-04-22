import 'dotenv/config';
import { bullConnection } from '../utils/redis.js';
import { Queue, Worker } from 'bullmq';

const TEST_QUEUE = 'redis-test';

async function run() {
  console.log('\n🔍 Testing Redis connection...');
  console.log(`   URL: ${(process.env.REDIS_URL || 'redis://localhost:6379').replace(/:([^@]+)@/, ':****@')}\n`);

  // 1. Ping
  try {
    const pong = await bullConnection.ping();
    if (pong === 'PONG') {
      console.log('✅ Redis ping: PONG — connection works');
    } else {
      throw new Error(`Unexpected ping response: ${pong}`);
    }
  } catch (err) {
    console.error('❌ Redis ping failed:', err.message);
    process.exit(1);
  }

  // 2. Add a test job
  const queue = new Queue(TEST_QUEUE, { connection: bullConnection });
  const job   = await queue.add('test-job', { message: 'hello from salon SaaS', ts: Date.now() });
  console.log(`✅ Test job added — ID: ${job.id}`);

  // 3. Process it
  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Worker timed out after 10s')), 10000);

    const worker = new Worker(TEST_QUEUE, async (j) => {
      clearTimeout(timeout);
      return j.data;
    }, { connection: bullConnection });

    worker.on('completed', async (j) => {
      console.log(`✅ Test job processed — data: ${JSON.stringify(j.data)}`);
      await worker.close();
      resolve(true);
    });

    worker.on('failed', async (j, err) => {
      clearTimeout(timeout);
      await worker.close();
      reject(err);
    });
  });

  if (result) {
    console.log('\n🎉 Redis + BullMQ are working correctly!\n');
  }

  await queue.close();
  bullConnection.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
