/**
 * Customer service — wraps Supabase with transparent PII encryption/decryption
 *
 * After running scripts/migrate-encrypt-pii.js, all phone/email/name values
 * in the DB are encrypted. This service handles encrypt-on-write and
 * decrypt-on-read automatically so the rest of the app sees plaintext.
 *
 * Fields encrypted:
 *   - phone  → encryptDeterministic (searchable)
 *   - email  → encryptDeterministic (searchable)
 *   - name   → encrypt (random IV, not searchable by encrypted value)
 */
import { supabase } from '../lib/supabase.js';
import { encrypt, encryptDeterministic, decrypt, isEncrypted } from '../utils/encryption.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function encryptCustomer(data) {
  const out = { ...data };
  if (data.phone !== undefined) out.phone = encryptDeterministic(data.phone);
  if (data.email !== undefined) out.email = encryptDeterministic(data.email);
  if (data.name  !== undefined) out.name  = encrypt(data.name);
  return out;
}

function decryptCustomer(row) {
  if (!row) return row;
  return {
    ...row,
    phone: decrypt(row.phone),
    email: decrypt(row.email),
    name:  decrypt(row.name),
  };
}

function decryptAll(rows) {
  return (rows || []).map(decryptCustomer);
}

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Get all customers for a tenant (paginated)
 */
export async function getCustomers({ tenant_id, search, limit = 50, offset = 0 }) {
  let query = supabase
    .from('customers')
    .select('id,name,phone,email,loyalty_points,total_spent,visit_count,preferred_language,created_at', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Encrypted deterministic search — encrypt query term to match stored value
  if (search) {
    const encPhone = encryptDeterministic(search);
    const encEmail = encryptDeterministic(search);
    query = query.or(`phone.eq.${encPhone},email.eq.${encEmail}`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: decryptAll(data), count };
}

/**
 * Get single customer by ID
 */
export async function getCustomerById({ id, tenant_id }) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .single();
  if (error) throw error;
  return decryptCustomer(data);
}

/**
 * Find customer by phone number (deterministic lookup)
 */
export async function findByPhone({ phone, tenant_id }) {
  const encPhone = encryptDeterministic(phone);
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('phone', encPhone)
    .eq('is_deleted', false)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return decryptCustomer(data);
}

/**
 * Create a new customer (encrypts PII before insert)
 */
export async function createCustomer({ tenant_id, name, phone, email, preferred_language }) {
  const payload = encryptCustomer({ name, phone, email });
  const { data, error } = await supabase
    .from('customers')
    .insert({ tenant_id, ...payload, preferred_language })
    .select()
    .single();
  if (error) throw error;
  return decryptCustomer(data);
}

/**
 * Update customer profile (encrypts any PII fields present in the update)
 */
export async function updateCustomer({ id, tenant_id, updates }) {
  const payload = encryptCustomer(updates);
  const { data, error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single();
  if (error) throw error;
  return decryptCustomer(data);
}

/**
 * Soft-delete (GDPR anonymize)
 */
export async function anonymizeCustomer({ id, tenant_id }) {
  const { error } = await supabase
    .from('customers')
    .update({
      name:       encrypt('Anonymous'),
      email:      null,
      phone:      encrypt('REDACTED'),
      is_deleted: true,
    })
    .eq('id', id)
    .eq('tenant_id', tenant_id);
  if (error) throw error;
}

/**
 * Export all customer PII (decrypted) for GDPR export
 */
export async function exportCustomers({ tenant_id }) {
  const { data, error } = await supabase
    .from('customers')
    .select('id,name,phone,email,created_at,loyalty_points,total_spent,visit_count')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false);
  if (error) throw error;
  return decryptAll(data);
}
