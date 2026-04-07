```javascript
import { exec } from 'child_process';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import os from 'os';
import path from 'path';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const s3Client = new S3Client({ region: process.env.AWS_REGION });

async function backupToS3(filePath, bucketName) {
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => logger.error(`Error reading file ${filePath}: ${err}`));
  
  const params = {
    Bucket: bucketName,
    Key: path.basename(filePath),
    Body: fileStream,
  };
  
  try {
    await s3Client.send(new PutObjectCommand(params));
    logger.info(`Successfully uploaded ${filePath} to S3 bucket ${bucketName}`);
  } catch (err) {
    logger.error(`Error uploading file ${filePath} to S3: ${err}`);
    process.exit(1);
  }
}

function deleteOldBackups() {
  const backupDir = path.join(os.homedir(), 'backups');
  
  fs.readdirSync(backupDir)
    .filter((file) => file.endsWith('.gz'))
    .sort()
    .slice(0, -7) // Keep the last 7 backups
    .forEach((file) => {
      const filePath = path.join(backupDir, file);
      
      fs.unlinkSync(filePath);
      logger.info(`Deleted old backup ${filePath}`);
    });
}

async function main() {
  const bucketName = process.env.AWS_BUCKET;
  
  if (!bucketName) {
    logger.error('No AWS bucket specified');
    return;
  }
  
  const backupDir = path.join(os.homedir(), 'backups');
  const filePath = `${backupDir}/backup-${Date.now()}.gz`;
  
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    
    exec(`mongodump --gzip --archive=${filePath}`, (error) => {
      if (error) throw error;
      
      backupToS3(filePath, bucketName).then(() => deleteOldBackups());
    });
  } catch (err) {
    logger.error(`Error creating backup: ${err}`);
    process.exit(1);
  }
}

main();
```