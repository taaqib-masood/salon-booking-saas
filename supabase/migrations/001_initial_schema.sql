-- ============================================================
-- Salon Booking SaaS — Supabase (PostgreSQL) Migration
-- Source: MongoDB Mongoose schemas → /models/*.js
-- VAT: 5% (UAE). RLS: tenant_id from JWT claim.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for name search

-- ────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ────────────────────────────────────────────────────────────
CREATE TYPE tenant_plan          AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE staff_role           AS ENUM ('admin', 'manager', 'receptionist', 'stylist');
CREATE TYPE appointment_status   AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method       AS ENUM ('cash', 'card', 'online');
CREATE TYPE loyalty_tx_type      AS ENUM ('earn', 'redeem', 'expire', 'bonus');
CREATE TYPE notification_type    AS ENUM ('booking_confirmation', 'reminder', 'cancellation', 'waitlist_available', 'loyalty_update');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms', 'email');
CREATE TYPE notification_status  AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE discount_type        AS ENUM ('percentage', 'fixed_aed');
CREATE TYPE webhook_status       AS ENUM ('pending', 'success', 'failure');
CREATE TYPE subscription_status  AS ENUM ('active', 'cancelled', 'expired', 'trialing');
CREATE TYPE pos_provider         AS ENUM ('square', 'stripe_terminal', 'manual');
CREATE TYPE report_status        AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE preferred_lang       AS ENUM ('en', 'ar');

-- ────────────────────────────────────────────────────────────
-- 2. HELPER: updated_at trigger
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. TENANTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  owner_name       TEXT,
  owner_email      TEXT NOT NULL,
  owner_phone      TEXT,
  plan             tenant_plan NOT NULL DEFAULT 'free',
  plan_expires_at  TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  branch_limit     INT NOT NULL DEFAULT 1,
  staff_limit      INT NOT NULL DEFAULT 5,
  settings         JSONB NOT NULL DEFAULT '{
    "currency": "AED",
    "vatRate": 0.05,
    "timezone": "Asia/Dubai",
    "weekendDays": ["Friday", "Saturday"],
    "loyaltyEnabled": true,
    "whatsappEnabled": false
  }'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug     ON tenants (slug);
CREATE INDEX idx_tenants_plan     ON tenants (plan);
CREATE INDEX idx_tenants_active   ON tenants (is_active);

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 4. TENANT SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE tenant_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan                    TEXT NOT NULL,
  start_date              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date                TIMESTAMPTZ,
  amount                  NUMERIC(10,2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'AED',
  stripe_subscription_id  TEXT NOT NULL,
  stripe_customer_id      TEXT NOT NULL,
  status                  subscription_status NOT NULL DEFAULT 'active',
  invoices                JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_subs_tenant ON tenant_subscriptions (tenant_id);
CREATE INDEX idx_tenant_subs_status ON tenant_subscriptions (status);

CREATE TRIGGER trg_tenant_subs_updated_at
  BEFORE UPDATE ON tenant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 5. BRANCHES
-- ────────────────────────────────────────────────────────────
CREATE TABLE branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL,
  address       JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {"street":"...","area":"...","emirate":"Dubai","country":"UAE"}
  working_hours JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [{"day":"Monday","open":"09:00","close":"21:00","isClosed":false}]
  holidays      DATE[] NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  is_deleted    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_tenant    ON branches (tenant_id);
CREATE INDEX idx_branches_active    ON branches (tenant_id, is_active) WHERE is_deleted = false;

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 6. SERVICE CATEGORIES
-- ────────────────────────────────────────────────────────────
CREATE TABLE service_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name_en       TEXT NOT NULL,
  name_ar       TEXT NOT NULL,
  icon          TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_svc_cat_tenant ON service_categories (tenant_id);
CREATE INDEX idx_svc_cat_order  ON service_categories (tenant_id, display_order);

CREATE TRIGGER trg_svc_cat_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 7. SERVICES
-- ────────────────────────────────────────────────────────────
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name_en         TEXT NOT NULL,
  name_ar         TEXT,
  description_en  TEXT,
  description_ar  TEXT,
  duration        INT NOT NULL,         -- minutes
  price           NUMERIC(10,2) NOT NULL,
  vat_inclusive   BOOLEAN NOT NULL DEFAULT true,
  -- Generated: price excluding VAT (when vat_inclusive=true, base = price/1.05)
  price_with_vat  NUMERIC(10,2) GENERATED ALWAYS AS (
    ROUND(price * 1.05, 2)
  ) STORED,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_tenant   ON services (tenant_id);
CREATE INDEX idx_services_category ON services (category_id);
CREATE INDEX idx_services_active   ON services (tenant_id, is_active) WHERE is_deleted = false;
CREATE INDEX idx_services_name_trgm ON services USING gin (name_en gin_trgm_ops);

CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Service ↔ Branch (many-to-many)
CREATE TABLE service_branches (
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  branch_id  UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, branch_id)
);
CREATE INDEX idx_svc_branches_branch ON service_branches (branch_id);

-- ────────────────────────────────────────────────────────────
-- 8. STAFF
-- ────────────────────────────────────────────────────────────
CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  role            staff_role NOT NULL DEFAULT 'stylist',
  specialties     TEXT[] NOT NULL DEFAULT '{}',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  working_days    TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT false,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

CREATE INDEX idx_staff_tenant   ON staff (tenant_id);
CREATE INDEX idx_staff_branch   ON staff (branch_id);
CREATE INDEX idx_staff_role     ON staff (tenant_id, role);
CREATE INDEX idx_staff_active   ON staff (tenant_id, is_active) WHERE is_deleted = false;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 9. CUSTOMERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  preferred_stylist   UUID REFERENCES staff(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT NOT NULL,
  password_hash       TEXT,
  preferred_language  preferred_lang NOT NULL DEFAULT 'en',
  loyalty_points      INT NOT NULL DEFAULT 0,
  total_spent         NUMERIC(12,2) NOT NULL DEFAULT 0,
  visit_count         INT NOT NULL DEFAULT 0,
  notes               TEXT,
  is_deleted          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, phone)
);

CREATE INDEX idx_customers_tenant ON customers (tenant_id);
CREATE INDEX idx_customers_phone  ON customers (tenant_id, phone);
CREATE INDEX idx_customers_email  ON customers (tenant_id, email);
CREATE INDEX idx_customers_active ON customers (tenant_id) WHERE is_deleted = false;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 10. APPOINTMENTS  (real-time enabled)
-- ────────────────────────────────────────────────────────────
CREATE TABLE appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id           UUID NOT NULL REFERENCES branches(id),
  staff_id            UUID NOT NULL REFERENCES staff(id),
  service_id          UUID NOT NULL REFERENCES services(id),
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  guest               JSONB,           -- {"name":"...","phone":"..."} when is_guest=true
  date                DATE NOT NULL,
  time_slot           TIME NOT NULL,
  end_time            TIME,
  status              appointment_status NOT NULL DEFAULT 'pending',
  subtotal            NUMERIC(10,2),
  vat_amount          NUMERIC(10,2),
  total_amount        NUMERIC(10,2),
  -- Generated: subtotal * 1.05 (convenience column, cross-check)
  total_with_vat      NUMERIC(10,2) GENERATED ALWAYS AS (
    ROUND(COALESCE(subtotal, 0) * 1.05, 2)
  ) STORED,
  discount_amount     NUMERIC(10,2) DEFAULT 0,
  discount_ref        TEXT,
  payment_method      payment_method,
  notes               TEXT,
  cancellation_reason TEXT,
  reminder_sent       BOOLEAN NOT NULL DEFAULT false,
  is_guest            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_tenant    ON appointments (tenant_id);
CREATE INDEX idx_appt_branch    ON appointments (branch_id);
CREATE INDEX idx_appt_staff     ON appointments (staff_id);
CREATE INDEX idx_appt_customer  ON appointments (customer_id);
CREATE INDEX idx_appt_service   ON appointments (service_id);
CREATE INDEX idx_appt_date      ON appointments (tenant_id, date);
CREATE INDEX idx_appt_status    ON appointments (tenant_id, status);
-- Compound: availability queries
CREATE INDEX idx_appt_avail     ON appointments (staff_id, date, status)
  WHERE status NOT IN ('cancelled', 'no_show');

CREATE TRIGGER trg_appt_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 11. REVIEWS
-- ────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id  UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_tenant  ON reviews (tenant_id);
CREATE INDEX idx_reviews_staff   ON reviews (staff_id);
CREATE INDEX idx_reviews_service ON reviews (service_id);
CREATE INDEX idx_reviews_rating  ON reviews (tenant_id, rating);

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 12. LOYALTY TRANSACTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points          INT NOT NULL,
  type            loyalty_tx_type NOT NULL,
  reference_type  TEXT,
  reference_id    UUID,
  description     TEXT,
  balance         INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: loyalty ledger is append-only
);

CREATE INDEX idx_loyalty_tenant   ON loyalty_transactions (tenant_id);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions (customer_id);
CREATE INDEX idx_loyalty_type     ON loyalty_transactions (tenant_id, type);

-- ────────────────────────────────────────────────────────────
-- 13. PACKAGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE packages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  total_sessions INT NOT NULL DEFAULT 1,
  price          NUMERIC(10,2) NOT NULL,
  validity_days  INT NOT NULL DEFAULT 365,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_tenant ON packages (tenant_id);

CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Package ↔ Service (many-to-many)
CREATE TABLE package_services (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, service_id)
);

-- Customer ↔ Package (purchased)
CREATE TABLE customer_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  package_id    UUID NOT NULL REFERENCES packages(id),
  sessions_left INT NOT NULL,
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cust_pkg_tenant   ON customer_packages (tenant_id);
CREATE INDEX idx_cust_pkg_customer ON customer_packages (customer_id);

CREATE TRIGGER trg_cust_pkg_updated_at
  BEFORE UPDATE ON customer_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 14. OFFERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  discount_type   discount_type NOT NULL,
  discount_value  NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses        INT NOT NULL,
  used_count      INT NOT NULL DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_to        TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX idx_offers_tenant ON offers (tenant_id);
CREATE INDEX idx_offers_code   ON offers (tenant_id, code);
CREATE INDEX idx_offers_active ON offers (tenant_id, is_active, valid_to);

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Offer ↔ Service (applicable services)
CREATE TABLE offer_services (
  offer_id   UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (offer_id, service_id)
);

-- ────────────────────────────────────────────────────────────
-- 15. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type            notification_type NOT NULL,
  channel         notification_channel NOT NULL,
  status          notification_status NOT NULL DEFAULT 'pending',
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  payload         JSONB,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_tenant   ON notifications (tenant_id);
CREATE INDEX idx_notif_status   ON notifications (status, scheduled_at);
CREATE INDEX idx_notif_customer ON notifications (customer_id);

-- ────────────────────────────────────────────────────────────
-- 16. WEBHOOKS
-- ────────────────────────────────────────────────────────────
CREATE TABLE webhooks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url         TEXT NOT NULL CHECK (url LIKE 'https://%'),
  secret      TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  events      TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  stats       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by  UUID,   -- staff_id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_tenant ON webhooks (tenant_id);

CREATE TRIGGER trg_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Webhook Deliveries (TTL: 1 day via pg_cron or Supabase scheduled function)
CREATE TABLE webhook_deliveries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id       UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event            TEXT NOT NULL,
  payload          JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt          INT NOT NULL DEFAULT 0,
  status           webhook_status NOT NULL DEFAULT 'pending',
  response_status  INT,
  response_body    JSONB,
  response_time_ms INT,
  error            TEXT,
  next_retry_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wh_del_webhook    ON webhook_deliveries (webhook_id);
CREATE INDEX idx_wh_del_tenant     ON webhook_deliveries (tenant_id);
CREATE INDEX idx_wh_del_retry      ON webhook_deliveries (next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_wh_del_created    ON webhook_deliveries (created_at);

-- ────────────────────────────────────────────────────────────
-- 17. AUDIT LOGS (append-only, 90-day retention)
-- ────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  actor_type   TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT NOT NULL,
  changes      JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant     ON audit_logs (tenant_id);
CREATE INDEX idx_audit_actor      ON audit_logs (tenant_id, actor_id);
CREATE INDEX idx_audit_target     ON audit_logs (target_type, target_id);
CREATE INDEX idx_audit_created    ON audit_logs (created_at);

-- 90-day cleanup: run via Supabase pg_cron
-- SELECT cron.schedule('purge-audit-logs', '0 2 * * *',
--   $$DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'$$);

-- ────────────────────────────────────────────────────────────
-- 18. REPORTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type                    TEXT NOT NULL,
  format                  TEXT NOT NULL DEFAULT 'xlsx',
  status                  report_status NOT NULL DEFAULT 'pending',
  requested_by            UUID,   -- staff_id
  parameters              JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path               TEXT,
  file_size               BIGINT,
  download_url            TEXT,
  download_url_expires_at TIMESTAMPTZ,
  emailed_to              TEXT[] NOT NULL DEFAULT '{}',
  processing_started_at   TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  error_message           TEXT,
  row_count               INT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_tenant ON reports (tenant_id);
CREATE INDEX idx_reports_status ON reports (tenant_id, status);

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ────────────────────────────────────────────────────────────
-- 19. POS TERMINALS
-- ────────────────────────────────────────────────────────────
CREATE TABLE pos_terminals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id    UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  terminal_id  TEXT NOT NULL UNIQUE,
  provider     pos_provider NOT NULL,
  location_id  TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pos_tenant ON pos_terminals (tenant_id);
CREATE INDEX idx_pos_branch ON pos_terminals (branch_id);

CREATE TRIGGER trg_pos_updated_at
  BEFORE UPDATE ON pos_terminals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- REAL-TIME SUBSCRIPTIONS
-- Enable replication for availability + live dashboard
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- JWT claim: auth.jwt() ->> 'tenant_id'
-- Set this in your Supabase Auth hook or custom JWT template.
-- ============================================================

-- Helper: extract tenant_id from JWT
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID
LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::uuid;
$$;

-- ── tenants ──────────────────────────────────────────────────
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant: select own"  ON tenants FOR SELECT
  USING (id = auth_tenant_id());
CREATE POLICY "tenant: update own"  ON tenants FOR UPDATE
  USING (id = auth_tenant_id());
-- INSERT/DELETE: service-role only (admin API)

-- ── tenant_subscriptions ─────────────────────────────────────
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tsub: select own" ON tenant_subscriptions FOR SELECT
  USING (tenant_id = auth_tenant_id());
-- Writes: service-role only

-- ── branches ─────────────────────────────────────────────────
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches: select own"  ON branches FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "branches: insert own"  ON branches FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "branches: update own"  ON branches FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "branches: delete own"  ON branches FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── service_categories ───────────────────────────────────────
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc_cat: select own"  ON service_categories FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "svc_cat: insert own"  ON service_categories FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "svc_cat: update own"  ON service_categories FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "svc_cat: delete own"  ON service_categories FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── services ─────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services: select own"  ON services FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "services: insert own"  ON services FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "services: update own"  ON services FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "services: delete own"  ON services FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── service_branches (junction — inherit via service FK) ──────
ALTER TABLE service_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "svc_branches: select"  ON service_branches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = service_id AND s.tenant_id = auth_tenant_id()
  ));
CREATE POLICY "svc_branches: insert"  ON service_branches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = service_id AND s.tenant_id = auth_tenant_id()
  ));
CREATE POLICY "svc_branches: delete"  ON service_branches FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM services s
    WHERE s.id = service_id AND s.tenant_id = auth_tenant_id()
  ));

-- ── staff ────────────────────────────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff: select own"  ON staff FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "staff: insert own"  ON staff FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "staff: update own"  ON staff FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "staff: delete own"  ON staff FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── customers ────────────────────────────────────────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: select own"  ON customers FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "customers: insert own"  ON customers FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "customers: update own"  ON customers FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "customers: delete own"  ON customers FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── appointments ─────────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appt: select own"  ON appointments FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "appt: insert own"  ON appointments FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "appt: update own"  ON appointments FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "appt: delete own"  ON appointments FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- ── reviews ──────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews: select own"   ON reviews FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "reviews: insert own"   ON reviews FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "reviews: update own"   ON reviews FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── loyalty_transactions ─────────────────────────────────────
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty: select own"  ON loyalty_transactions FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "loyalty: insert own"  ON loyalty_transactions FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
-- No UPDATE/DELETE: ledger is append-only

-- ── packages ─────────────────────────────────────────────────
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages: select own" ON packages FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "packages: insert own" ON packages FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "packages: update own" ON packages FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── customer_packages ────────────────────────────────────────
ALTER TABLE customer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cust_pkg: select own" ON customer_packages FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "cust_pkg: insert own" ON customer_packages FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "cust_pkg: update own" ON customer_packages FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── offers ───────────────────────────────────────────────────
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers: select own" ON offers FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "offers: insert own" ON offers FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "offers: update own" ON offers FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── notifications ────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif: select own" ON notifications FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "notif: insert own" ON notifications FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "notif: update own" ON notifications FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── webhooks ─────────────────────────────────────────────────
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks: select own" ON webhooks FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "webhooks: insert own" ON webhooks FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "webhooks: update own" ON webhooks FOR UPDATE
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "webhooks: delete own" ON webhooks FOR DELETE
  USING (tenant_id = auth_tenant_id());

-- webhook_deliveries: service-role only (internal delivery engine)
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh_del: select own" ON webhook_deliveries FOR SELECT
  USING (tenant_id = auth_tenant_id());

-- ── audit_logs ───────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit: select own"  ON audit_logs FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "audit: insert own"  ON audit_logs FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
-- No UPDATE/DELETE: append-only

-- ── reports ──────────────────────────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports: select own" ON reports FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "reports: insert own" ON reports FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "reports: update own" ON reports FOR UPDATE
  USING (tenant_id = auth_tenant_id());

-- ── pos_terminals ────────────────────────────────────────────
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos: select own" ON pos_terminals FOR SELECT
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "pos: insert own" ON pos_terminals FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id());
CREATE POLICY "pos: update own" ON pos_terminals FOR UPDATE
  USING (tenant_id = auth_tenant_id());
