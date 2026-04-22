/**
 * Daily backup — exports Supabase tables to Supabase Storage bucket "backups"
 * Runs at 2AM Dubai time (10PM UTC)
 *
 * Free tier: Supabase Storage gives 1GB — daily JSON backups of a small salon
 * stay well under that (typically < 5MB/day).
 *
 * Retention: 7 days. Older backups are deleted automatically.
 *
 * Setup (one-time):
 *   Supabase Dashboard → Storage → New bucket → Name: "backups" → Private ✓
 */
import cron from 'node-cron';
import { supabase } from '../lib/supabase.js';
import { createLogger } from '../utils/logger.js';

const log          = createLogger('Backup');
const BUCKET       = 'backups';
const RETAIN_DAYS  = 7;
const TABLES       = [
  'tenants', 'branches', 'staff', 'services',
  'customers', 'appointments', 'staff_breaks', 'staff_schedules',
];

// ── Ensure bucket exists ──────────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error) throw new Error(`Cannot create bucket: ${error.message}`);
    log.info('Created storage bucket', { bucket: BUCKET });
  }
}

// ── Export one table and upload ───────────────────────────────────────────────
async function backupTable(table, date) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw new Error(`${table}: ${error.message}`);

  const payload = JSON.stringify(
    { table, exported_at: new Date().toISOString(), count: data?.length ?? 0, data: data ?? [] },
    null, 2
  );

  const path = `${date}/${table}.json`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(payload), { contentType: 'application/json', upsert: true });

  if (uploadErr) throw new Error(`Upload ${path}: ${uploadErr.message}`);
  return data?.length ?? 0;
}

// ── Delete backups older than RETAIN_DAYS ─────────────────────────────────────
async function pruneOldBackups() {
  const { data: folders } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
  if (!folders?.length) return;

  const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;

  for (const folder of folders) {
    const folderDate = new Date(folder.name);
    if (isNaN(folderDate) || folderDate.getTime() > cutoff) continue;

    // List files in this date folder
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(folder.name, { limit: 100 });

    if (files?.length) {
      const paths = files.map(f => `${folder.name}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(paths);
    }

    log.info('Pruned old backup', { folder: folder.name });
  }
}

// ── Main backup run ───────────────────────────────────────────────────────────
async function runBackup() {
  const date = new Date().toISOString().split('T')[0];
  log.info('Starting backup', { date, tables: TABLES.length });

  await ensureBucket();

  let success = 0;
  let failed  = 0;

  for (const table of TABLES) {
    try {
      const rows = await backupTable(table, date);
      log.info('Table backed up', { table, rows });
      success++;
    } catch (err) {
      log.error('Table backup failed', { table, error: err.message });
      failed++;
    }
  }

  // Upload manifest
  const manifest = JSON.stringify({
    date, success, failed,
    tables: TABLES,
    created_at: new Date().toISOString(),
  }, null, 2);

  await supabase.storage
    .from(BUCKET)
    .upload(`${date}/manifest.json`, Buffer.from(manifest), { contentType: 'application/json', upsert: true });

  log.info('Backup complete', { date, success, failed });

  await pruneOldBackups();
}

// ── Cron ──────────────────────────────────────────────────────────────────────
export function startBackupJob() {
  // 10PM UTC = 2AM Dubai (UTC+4)
  cron.schedule('0 22 * * *', async () => {
    try { await runBackup(); }
    catch (err) { log.error('Backup job crashed', { error: err.message }); }
  }, { timezone: 'UTC' });

  log.info('Backup job scheduled (2AM Dubai / 10PM UTC)');
}

// Allow manual run: node cron/backup.js
if (process.argv[1]?.endsWith('backup.js')) {
  runBackup()
    .then(() => { log.info('Manual backup done'); process.exit(0); })
    .catch(err => { log.error('Manual backup failed', { error: err.message }); process.exit(1); });
}
