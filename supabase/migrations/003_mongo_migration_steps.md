# MongoDB → Supabase Migration Steps

## Prerequisites
- `mongoexport` installed
- `psql` or Supabase CLI
- Node.js script for ObjectId → UUID mapping

---

## Phase 1 — Schema Deploy

```bash
supabase db push   # runs migrations 001 + 002 in order
```

Or paste directly into Supabase SQL Editor.

---

## Phase 2 — Export MongoDB Collections

```bash
for col in tenants branches service_categories services staff customers \
           appointments reviews loyalty_transactions packages offers \
           notifications webhooks audit_logs reports; do
  mongoexport \
    --uri="$MONGO_URI" \
    --collection="$col" \
    --jsonArray \
    --out="export/$col.json"
done
```

---

## Phase 3 — Transform + Load (Node.js)

Key transforms needed:

| MongoDB | PostgreSQL |
|---------|-----------|
| `_id: ObjectId("...")` | `id: uuid` (generate fresh or hash ObjectId to UUID v5) |
| `tenant: ObjectId` | `tenant_id: uuid` |
| Nested `address {}` | Keep as JSONB — direct insert |
| Array of ObjectIds `[ObjectId, ...]` | Junction table rows |
| `workingHours: [{day,open,close}]` | JSONB array — direct insert |
| `Date` fields | ISO string → `TIMESTAMPTZ` |
| `createdAt` auto | Preserved from export |

```js
// Transform script skeleton
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import data from './export/tenants.json' assert { type: 'json' };

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // URL namespace
const supabase = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY);

// Convert MongoDB ObjectId string → deterministic UUID v5
function toUUID(objectId) {
  return uuidv5(objectId.toString(), NAMESPACE);
}

async function migrateTenants() {
  const rows = data.map(doc => ({
    id:              toUUID(doc._id),
    name:            doc.name,
    slug:            doc.slug,
    owner_name:      doc.ownerName,
    owner_email:     doc.ownerEmail,
    owner_phone:     doc.ownerPhone,
    plan:            doc.plan ?? 'free',
    plan_expires_at: doc.planExpiresAt ?? null,
    is_active:       doc.isActive ?? true,
    branch_limit:    doc.branchLimit ?? 1,
    staff_limit:     doc.staffLimit ?? 5,
    settings:        doc.settings ?? {},
    created_at:      doc.createdAt,
  }));

  const { error } = await supabase.from('tenants').insert(rows);
  if (error) throw error;
  console.log(`Migrated ${rows.length} tenants`);
}

// Repeat pattern for each collection.
// Run in FK-dependency order:
// 1. tenants → 2. branches → 3. service_categories → 4. services
// 5. staff → 6. customers → 7. appointments → 8. reviews
// 9. loyalty_transactions → 10. packages → 11. offers
// 12. notifications → 13. webhooks → 14. audit_logs → 15. reports
```

---

## Phase 4 — Junction Tables

After all base tables are loaded:

```js
// service_branches: services[].branches array
async function migrateServiceBranches() {
  const services = await loadExport('services.json');
  const rows = services.flatMap(svc =>
    (svc.branches ?? []).map(branchId => ({
      service_id: toUUID(branchId),
      branch_id:  toUUID(branchId),
    }))
  );
  await supabase.from('service_branches').insert(rows);
}

// offer_services, package_services: same pattern
```

---

## Phase 5 — Verify

```sql
-- Row counts match
SELECT
  (SELECT COUNT(*) FROM tenants)       AS tenants,
  (SELECT COUNT(*) FROM branches)      AS branches,
  (SELECT COUNT(*) FROM staff)         AS staff,
  (SELECT COUNT(*) FROM customers)     AS customers,
  (SELECT COUNT(*) FROM appointments)  AS appointments;

-- RLS sanity check (run as anon or with a test JWT)
SET request.jwt.claims = '{"tenant_id": "<your-test-tenant-uuid>"}';
SELECT COUNT(*) FROM appointments;   -- should only return that tenant's rows
RESET request.jwt.claims;
```

---

## Phase 6 — JWT Custom Claim Setup

In Supabase Auth → **Hooks** → Add a custom JWT claim hook:

```sql
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  tenant_uuid uuid;
BEGIN
  -- Look up tenant_id for this user from your staff/customers table
  SELECT tenant_id INTO tenant_uuid
  FROM staff
  WHERE id = (event->>'user_id')::uuid
  LIMIT 1;

  RETURN jsonb_set(event, '{claims,tenant_id}', to_jsonb(tenant_uuid::text));
END;
$$;
```

---

## Phase 7 — Real-time (Frontend)

```js
// Supabase JS v2 — watch appointment status changes for a branch
const channel = supabase
  .channel('appointments-live')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'appointments',
    filter: `branch_id=eq.${branchId}`,
  }, (payload) => {
    console.log('Appointment updated:', payload.new);
    updateCalendarUI(payload.new);
  })
  .subscribe();
```

---

## Cutover Checklist

- [ ] Deploy schema (001)
- [ ] Run migration script (Phases 2–4)
- [ ] Verify row counts
- [ ] Test RLS with JWT claim
- [ ] Update Node.js `models/` imports → Supabase client calls
- [ ] Update `utils/redis.js` cache keys (tenant-scoped)
- [ ] Redirect `MONGO_URI` → `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in env
- [ ] Enable real-time on Supabase dashboard for `appointments`, `staff`, `notifications`
- [ ] Set pg_cron for audit_log 90-day purge
