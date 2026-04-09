-- ============================================================
-- TOP 10 API ENDPOINT EQUIVALENTS (Supabase / PostgreSQL)
-- ============================================================

-- ── 1. GET /availability?staff=&date=&service= ──────────────
-- Returns booked time slots for a staff member on a date
-- so the frontend can grey them out.
SELECT
  time_slot,
  end_time,
  status
FROM appointments
WHERE
  staff_id   = $1::uuid
  AND date   = $2::date
  AND status NOT IN ('cancelled', 'no_show');
-- Index used: idx_appt_avail (staff_id, date, status)

-- ── 2. POST /appointments ───────────────────────────────────
INSERT INTO appointments (
  tenant_id, branch_id, staff_id, service_id, customer_id,
  date, time_slot, end_time, subtotal, vat_amount, total_amount,
  payment_method, is_guest, guest
)
VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9, $10, $11,
  $12, $13, $14
)
RETURNING
  id,
  date,
  time_slot,
  status,
  total_amount,
  total_with_vat;   -- generated column

-- ── 3. GET /appointments (paginated, tenant-scoped) ──────────
SELECT
  a.id,
  a.date,
  a.time_slot,
  a.status,
  a.total_amount,
  a.total_with_vat,
  c.name  AS customer_name,
  c.phone AS customer_phone,
  s.name  AS staff_name,
  sv.name_en AS service_name
FROM appointments a
JOIN customers c  ON c.id = a.customer_id
JOIN staff s      ON s.id = a.staff_id
JOIN services sv  ON sv.id = a.service_id
WHERE
  a.tenant_id = auth_tenant_id()
  AND ($1::date IS NULL OR a.date = $1)       -- optional date filter
  AND ($2::uuid IS NULL OR a.branch_id = $2)  -- optional branch filter
  AND ($3::appointment_status IS NULL OR a.status = $3)
ORDER BY a.date DESC, a.time_slot DESC
LIMIT $4 OFFSET $5;
-- Index used: idx_appt_tenant, idx_appt_date

-- ── 4. PATCH /appointments/:id/status ───────────────────────
UPDATE appointments
SET
  status = $2::appointment_status,
  cancellation_reason = CASE WHEN $2 = 'cancelled' THEN $3 ELSE NULL END
WHERE
  id = $1::uuid
  AND tenant_id = auth_tenant_id()
RETURNING id, status, updated_at;

-- ── 5. GET /services?branch= ────────────────────────────────
SELECT
  sv.id,
  sv.name_en,
  sv.name_ar,
  sv.duration,
  sv.price,
  sv.price_with_vat,    -- generated column
  sc.name_en AS category_name
FROM services sv
JOIN service_categories sc ON sc.id = sv.category_id
JOIN service_branches   sb ON sb.service_id = sv.id
WHERE
  sv.tenant_id = auth_tenant_id()
  AND sb.branch_id = $1::uuid
  AND sv.is_active = true
  AND sv.is_deleted = false
ORDER BY sc.display_order, sv.name_en;
-- Index used: idx_svc_branches_branch, idx_services_active

-- ── 6. GET /staff?branch= ───────────────────────────────────
SELECT
  id,
  name,
  role,
  specialties,
  commission_rate,
  working_days
FROM staff
WHERE
  tenant_id  = auth_tenant_id()
  AND branch_id  = $1::uuid
  AND is_active  = true
  AND is_deleted = false
ORDER BY name;

-- ── 7. POST /customers ──────────────────────────────────────
-- Upsert: phone is unique per tenant
INSERT INTO customers (tenant_id, name, phone, email, preferred_language)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (tenant_id, phone)
DO UPDATE SET
  name  = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW()
RETURNING id, name, phone, loyalty_points, visit_count;

-- ── 8. GET /analytics?from=&to= ─────────────────────────────
SELECT
  COUNT(*)                                    AS total_appointments,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
  COUNT(*) FILTER (WHERE status = 'no_show')   AS no_shows,
  SUM(total_amount)                            AS gross_revenue,
  SUM(vat_amount)                              AS total_vat,
  SUM(total_amount - COALESCE(discount_amount,0)) AS net_revenue,
  AVG(total_amount)                            AS avg_ticket
FROM appointments
WHERE
  tenant_id  = auth_tenant_id()
  AND date  >= $1::date
  AND date  <= $2::date;

-- Revenue by branch
SELECT
  b.name AS branch_name,
  COUNT(a.id)          AS appointment_count,
  SUM(a.total_amount)  AS revenue
FROM appointments a
JOIN branches b ON b.id = a.branch_id
WHERE
  a.tenant_id = auth_tenant_id()
  AND a.date BETWEEN $1 AND $2
  AND a.status = 'completed'
GROUP BY b.id, b.name
ORDER BY revenue DESC;

-- ── 9. POST /reviews ────────────────────────────────────────
-- One review per appointment (UNIQUE constraint enforced)
INSERT INTO reviews (tenant_id, appointment_id, customer_id, staff_id, service_id, branch_id, rating, comment)
SELECT
  a.tenant_id,
  a.id,
  a.customer_id,
  a.staff_id,
  a.service_id,
  a.branch_id,
  $2::smallint,
  $3
FROM appointments a
WHERE
  a.id        = $1::uuid
  AND a.status = 'completed'
  AND a.tenant_id = auth_tenant_id()
RETURNING id, rating, created_at;

-- ── 10. GET /loyalty/:customerId ────────────────────────────
-- Current balance + last 20 transactions
SELECT
  c.loyalty_points AS current_balance,
  c.total_spent,
  c.visit_count,
  (
    SELECT json_agg(t ORDER BY t.created_at DESC)
    FROM (
      SELECT points, type, description, balance, created_at
      FROM loyalty_transactions
      WHERE customer_id = c.id
      ORDER BY created_at DESC
      LIMIT 20
    ) t
  ) AS recent_transactions
FROM customers c
WHERE
  c.id = $1::uuid
  AND c.tenant_id = auth_tenant_id();
