/**
 * PII Encryption Migration
 * Encrypts existing plain-text phone/email/name in the customers table.
 *
 * ⚠️  READ BEFORE RUNNING:
 *  1. Take a Supabase backup first (Dashboard → Project Settings → Database → Backups)
 *  2. Run with --dry-run first to preview changes without writing
 *  3. This is IRREVERSIBLE — once encrypted, you need ENCRYPTION_KEY to read data
 *  4. After running, update every controller that reads/writes customer PII
 *     to use services/customer.service.js instead of raw Supabase queries
 *
 * Usage:
 *   node scripts/migrate-encrypt-pii.js --dry-run     # preview only
 *   node scripts/migrate-encrypt-pii.js               # encrypt for real
 *   node scripts/migrate-encrypt-pii.js --tenant=<id> # single tenant only
 */
import 'dotenv/config';
import { supabase } from '../lib/supabase.js';
import { encrypt, encryptDeterministic, isEncrypted } from '../utils/encryption.js';
import { createLogger } from '../utils/logger.js';

const log     = createLogger('PII-Migration');
const DRY_RUN = process.argv.includes('--dry-run');
const TENANT  = process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];
const BATCH   = 100; // rows per batch

async function run() {
  log.info(`Starting PII migration`, { dryRun: DRY_RUN, tenant: TENANT || 'all' });

  if (DRY_RUN) log.warn('DRY RUN — no data will be written');

  let offset = 0;
  let total = 0;
  let skipped = 0;
  let encrypted = 0;
  let errors = 0;

  while (true) {
    let query = supabase
      .from('customers')
      .select('id, name, phone, email, tenant_id')
      .eq('is_deleted', false)
      .range(offset, offset + BATCH - 1)
      .order('created_at', { ascending: true });

    if (TENANT) query = query.eq('tenant_id', TENANT);

    const { data: rows, error } = await query;
    if (error) { log.error('Fetch error', { error: error.message }); break; }
    if (!rows?.length) break;

    for (const row of rows) {
      total++;
      const nameEncrypted  = isEncrypted(row.name);
      const phoneEncrypted = isEncrypted(row.phone);
      const emailEncrypted = isEncrypted(row.email);

      if (nameEncrypted && phoneEncrypted && emailEncrypted) {
        skipped++;
        continue; // already migrated
      }

      const update = {};
      if (!nameEncrypted  && row.name)  update.name  = encrypt(row.name);
      if (!phoneEncrypted && row.phone) update.phone = encryptDeterministic(row.phone);
      if (!emailEncrypted && row.email) update.email = encryptDeterministic(row.email);

      if (DRY_RUN) {
        log.info('Would encrypt', {
          id: row.id,
          fields: Object.keys(update),
          name:  row.name  ? `${row.name.slice(0,2)}***` : null,
          phone: row.phone ? `****${row.phone.slice(-4)}` : null,
        });
        encrypted++;
        continue;
      }

      const { error: updateErr } = await supabase
        .from('customers')
        .update(update)
        .eq('id', row.id);

      if (updateErr) {
        log.error('Failed to encrypt row', { id: row.id, error: updateErr.message });
        errors++;
      } else {
        encrypted++;
      }
    }

    offset += BATCH;
    if (rows.length < BATCH) break; // last page
  }

  log.info('Migration complete', { total, encrypted, skipped, errors, dryRun: DRY_RUN });

  if (!DRY_RUN && encrypted > 0) {
    log.warn('⚠️  Next steps required:');
    log.warn('  1. Update controllers/customersController.js to use services/customer.service.js');
    log.warn('  2. Update routes/gdpr.js to use exportCustomers() and anonymizeCustomer()');
    log.warn('  3. Update cron/reminders.js to call decrypt(phone) before passing to sendReminder()');
    log.warn('  4. Update appointmentsController.js guest bookings to encrypt phone/email on save');
  }

  process.exit(errors > 0 ? 1 : 0);
}

run().catch(err => {
  log.error('Migration failed', { error: err.message });
  process.exit(1);
});
