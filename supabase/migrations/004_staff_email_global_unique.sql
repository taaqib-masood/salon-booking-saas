-- Staff login looks staff up by email across all tenants, so the email must be
-- globally unique among live staff. Without this, registering a second tenant
-- with an existing staff email makes that person's login fail.
-- If this fails, find conflicts with:
--   SELECT lower(trim(email)), array_agg(id) FROM staff WHERE is_deleted = false
--   GROUP BY 1 HAVING count(*) > 1;
UPDATE staff SET email = lower(trim(email)) WHERE email <> lower(trim(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_email_unique_live
  ON staff (lower(email)) WHERE is_deleted = false;
