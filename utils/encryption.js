/**
 * AES-256-GCM encryption for PII fields (UAE PDPL compliance)
 *
 * Two modes:
 *  - encrypt(text)            → random IV — use for non-searchable fields (names, notes)
 *  - encryptDeterministic(text) → fixed IV derived from key — use for searchable fields
 *                                 (phone, email) so you can query WHERE encrypted = ?
 *
 * ENCRYPTION_KEY must be a 64-char hex string (32 bytes).
 * Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';

const ALG       = 'aes-256-gcm';
const IV_LEN    = 12;   // 96-bit IV recommended for GCM
const TAG_LEN   = 16;
const PREFIX    = 'enc:'; // marks an already-encrypted value — prevents double-encryption

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt with a random IV — for non-searchable PII (names, addresses)
 * Output: "enc:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function encrypt(text) {
  if (!text) return text;
  if (String(text).startsWith(PREFIX)) return text; // already encrypted
  const key = getKey();
  const iv  = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a value encrypted with encrypt() or encryptDeterministic()
 * Returns original plaintext or null on failure (don't crash on bad data)
 */
export function decrypt(value) {
  if (!value) return value;
  const str = String(value);
  if (!str.startsWith(PREFIX)) return value; // plaintext (pre-migration data)
  try {
    const [, ivHex, tagHex, ctHex] = str.split(':');
    const key    = getKey();
    const iv     = Buffer.from(ivHex, 'hex');
    const tag    = Buffer.from(tagHex, 'hex');
    const ct     = Buffer.from(ctHex, 'hex');
    const decipher = createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null; // corrupted or wrong key
  }
}

/**
 * Deterministic encryption — same plaintext always produces same ciphertext
 * Use for searchable fields (phone, email) so WHERE enc_phone = encryptDeterministic(query) works
 * IV is derived from HMAC(key, plaintext) — NOT random, but still authenticated
 */
export function encryptDeterministic(text) {
  if (!text) return text;
  if (String(text).startsWith(PREFIX)) return text;
  const key = getKey();
  const iv  = createHmac('sha256', key).update(String(text)).digest().slice(0, IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Mask a value for logs — last 4 chars visible, rest replaced with *
 * e.g. +971501234567 → *********4567
 */
export function mask(value) {
  if (!value) return '[empty]';
  const s = String(value);
  return s.length > 4 ? `${'*'.repeat(s.length - 4)}${s.slice(-4)}` : '****';
}

/**
 * Check if a value is currently encrypted
 */
export function isEncrypted(value) {
  return value && String(value).startsWith(PREFIX);
}
