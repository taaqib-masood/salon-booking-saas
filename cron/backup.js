```javascript
import cron from 'node-cron';
import mongoose from 'mongoose';
import { JobLock } from './jobLock.js';

const backupTask = cron.schedule('0 2 * * *', async () => {
    const lockId = await JobLock.acquire();
    if (!lockId) return;

    try {
        // Perform backup here...
        console.log("Performing backup...");
        
        await JobLock.release(lockId);
    } catch (error) {
        console.error('Backup job failed:', error);
        await JobLock.release(lockId);
    }
}, {
    scheduled: false,
    timezone: "Asia/Dubai"
});

const verifyTask = cron.schedule('*/5 * * * *', async () => {
    const lockId = await JobLock.acquire();
    if (!lockId) return;

    try {
        // Perform verification here...
        console.log("Performing verification...");
        
        await JobLock.release(lockId);
    } catch (error) {
        console.error('Verification job failed:', error);
        await JobLock.release(lockId);
    }
}, {
    scheduled: false,
    timezone: "Asia/Dubai"
});

export const startBackupJob = () => backupTask.start();
export const startVerifyJob = () => verifyTask.start();
```