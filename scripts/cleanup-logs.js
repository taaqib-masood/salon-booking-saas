/**
 * Manual log cleanup script
 * Usage: node scripts/cleanup-logs.js [--days=30]
 * Deletes log files older than N days (default: 30)
 */
import fs from 'fs';
import path from 'path';

const args     = process.argv.slice(2);
const daysArg  = args.find(a => a.startsWith('--days='));
const DAYS     = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
const LOG_DIR  = path.resolve('logs');
const CUTOFF   = Date.now() - DAYS * 24 * 60 * 60 * 1000;

if (!fs.existsSync(LOG_DIR)) {
  console.log('No logs directory found — nothing to clean.');
  process.exit(0);
}

const files = fs.readdirSync(LOG_DIR);
let deleted = 0;
let freed   = 0;

for (const file of files) {
  const filePath = path.join(LOG_DIR, file);
  const stat     = fs.statSync(filePath);

  if (stat.mtimeMs < CUTOFF) {
    freed += stat.size;
    fs.unlinkSync(filePath);
    console.log(`  Deleted: ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
    deleted++;
  }
}

console.log(`\nDone. Deleted ${deleted} file(s), freed ${(freed / 1024 / 1024).toFixed(2)} MB.`);
process.exit(0);
