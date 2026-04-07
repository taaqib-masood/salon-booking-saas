```javascript
import { exec } from 'child_process';
import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

async function verifyBackup() {
  try {
    // Get the most recent backup from S3
    const data = await s3.listObjectsV2({ Bucket: process.env.S3_BUCKET }).promise();
    const backups = data.Contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    const backupKey = backups[0].Key;
    
    // Download the backup to a temporary location
    await s3.getObject({ Bucket: process.env.S3_BUCKET, Key: backupKey }).promise();
    
    // Run mongorestore --dryRun on the downloaded backup
    const restoreProcess = exec('mongorestore --dryRun /path/to/downloaded/backup');
    
    restoreProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    restoreProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    restoreProcess.on('close', (code) => {
      if (code !== 0) {
        // If the restore process fails, send a Slack alert
        fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Backup verification failed with code ${code}` }),
        });
      } else {
        // If the restore process succeeds, compare document counts against baseline
        // This is a placeholder and will need to be replaced with actual implementation
        const baselineCount = 100;
        const restoredCount = getDocumentCount();
        
        if (restoredCount !== baselineCount) {
          // If the document count does not match, send a Slack alert
          fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `Backup verification failed with document count mismatch` }),
          });
        } else {
          console.log('Backup verified successfully');
        }
      }
    });
  } catch (error) {
    // If any error occurs, send a Slack alert
    fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Backup verification failed with error ${error}` }),
    });
  }
}

function getDocumentCount() {
  // This function should return the document count of the restored database
  // It is a placeholder and will need to be replaced with actual implementation
  return 100;
}

verifyBackup();
```