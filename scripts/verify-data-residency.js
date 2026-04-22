/**
 * Data Residency Verification Script
 * Checks where your data actually lives for UAE PDPL compliance
 *
 * Usage: node scripts/verify-data-residency.js
 */
import 'dotenv/config';
import { supabase } from '../lib/supabase.js';

const PASS = '✅';
const WARN = '⚠️ ';
const FAIL = '❌';

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`${result.ok ? PASS : result.warn ? WARN : FAIL} ${label}`);
    if (result.detail) console.log(`   ${result.detail}`);
    return result.ok;
  } catch (err) {
    console.log(`${FAIL} ${label}`);
    console.log(`   Error: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('\n━━━ Data Residency Check — UAE PDPL ━━━━━━━━━━━━━━━━━━\n');

  // 1. Supabase connectivity
  await check('Supabase reachable', async () => {
    const { error } = await supabase.from('tenants').select('id').limit(1);
    return { ok: !error, detail: error ? error.message : `URL: ${process.env.SUPABASE_URL}` };
  });

  // 2. Supabase region (inferred from URL)
  await check('Supabase region', async () => {
    const url = process.env.SUPABASE_URL || '';
    const ref = url.replace('https://', '').split('.')[0];
    const detail = `Project: ${ref}\nVerify at: https://supabase.com/dashboard/project/${ref}/settings/general\nFor UAE PDPL: ensure region is eu-central-1 (Frankfurt) or me-central-1 (Middle East)`;
    return { ok: true, warn: true, detail };
  });

  // 3. Redis (Upstash)
  await check('Redis (Upstash) region', async () => {
    const url = process.env.REDIS_URL || '';
    if (!url.includes('upstash.io')) {
      return { ok: false, detail: 'Not using Upstash — using localhost (dev only)' };
    }
    const host = url.match(/@(.+?):/)?.[1] || 'unknown';
    const isMiddleEast = host.includes('ap-south'); // Mumbai = closest to UAE on free tier
    return {
      ok: isMiddleEast,
      warn: !isMiddleEast,
      detail: `Host: ${host}\nRegion: ${isMiddleEast ? 'Mumbai (ap-south-1) — closest to UAE' : 'Not Middle East region — review for compliance'}`,
    };
  });

  // 4. Encryption key set
  await check('ENCRYPTION_KEY configured', async () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) return { ok: false, detail: 'Not set — PII stored unencrypted. Add 64-char hex key to .env' };
    if (key.length !== 64) return { ok: false, detail: `Key is ${key.length} chars, expected 64` };
    return { ok: true, detail: 'Key is set and correct length' };
  });

  // 5. Check if PII is encrypted (sample row)
  await check('Customer PII encryption status', async () => {
    const { data } = await supabase.from('customers').select('phone, email').limit(1).single();
    if (!data) return { ok: true, detail: 'No customers yet' };
    const isEnc = data.phone?.startsWith('enc:') || data.email?.startsWith('enc:');
    return {
      ok: isEnc,
      warn: !isEnc,
      detail: isEnc
        ? 'PII is encrypted ✓'
        : 'PII is plain text — run: node scripts/migrate-encrypt-pii.js --dry-run',
    };
  });

  // 6. HTTPS
  await check('HTTPS configured', async () => {
    const url = process.env.APP_URL || '';
    const ok  = url.startsWith('https://') || process.env.NODE_ENV !== 'production';
    return {
      ok,
      warn: !url,
      detail: url ? `APP_URL: ${url}` : 'Set APP_URL in .env for production (e.g. https://yourapp.onrender.com)',
    };
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('UAE PDPL Resources:');
  console.log('  https://tdra.gov.ae/en/aicto/personal-data-protection');
  console.log('  https://supabase.com/docs/guides/platform/regions\n');
}

run().then(() => process.exit(0)).catch(err => {
  console.error('Check failed:', err.message);
  process.exit(1);
});
