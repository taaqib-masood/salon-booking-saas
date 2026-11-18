-- Enforce tenants.branch_limit on branch creation and restore, including concurrent requests.
CREATE OR REPLACE FUNCTION enforce_branch_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  max_branches    INT;
  active_branches INT;
BEGIN
  IF NEW.is_deleted OR (TG_OP = 'UPDATE' AND NOT OLD.is_deleted AND OLD.tenant_id = NEW.tenant_id) THEN
    RETURN NEW;
  END IF;

  -- Locking the tenant row serializes concurrent branch inserts for that tenant.
  SELECT branch_limit INTO max_branches FROM tenants WHERE id = NEW.tenant_id FOR UPDATE;

  SELECT count(*) INTO active_branches
  FROM branches
  WHERE tenant_id = NEW.tenant_id AND NOT is_deleted AND id <> NEW.id;

  IF active_branches >= max_branches THEN
    RAISE EXCEPTION 'branch_limit_reached' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_branches_limit ON branches;
CREATE TRIGGER trg_branches_limit
  BEFORE INSERT OR UPDATE OF is_deleted, tenant_id ON branches
  FOR EACH ROW EXECUTE FUNCTION enforce_branch_limit();
