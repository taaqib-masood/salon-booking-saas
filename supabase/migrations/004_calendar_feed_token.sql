-- Secret per-tenant calendar feed token; only its SHA-256 hash is stored.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS calendar_feed_token_hash TEXT UNIQUE;
