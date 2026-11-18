-- Deduct loyalty points and write the ledger row in one transaction.
-- The conditional UPDATE locks the row, so concurrent redemptions cannot both spend one balance.
-- Returns the new balance, or NULL when the customer is missing or the balance is too low.
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
  p_tenant_id UUID, p_customer_id UUID, p_points INT, p_description TEXT
) RETURNS INT
LANGUAGE plpgsql AS $$
DECLARE
  v_balance INT;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RAISE EXCEPTION 'points must be a positive integer';
  END IF;

  UPDATE customers
     SET loyalty_points = loyalty_points - p_points
   WHERE id = p_customer_id AND tenant_id = p_tenant_id AND loyalty_points >= p_points
  RETURNING loyalty_points INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO loyalty_transactions (tenant_id, customer_id, points, type, description, balance)
  VALUES (p_tenant_id, p_customer_id, -p_points, 'redeem', COALESCE(p_description, 'Points redeemed'), v_balance);

  RETURN v_balance;
END;
$$;

-- Only the backend (service role) may call it; it trusts the tenant_id argument.
REVOKE EXECUTE ON FUNCTION redeem_loyalty_points(UUID, UUID, INT, TEXT) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION redeem_loyalty_points(UUID, UUID, INT, TEXT) TO service_role;
  END IF;
END $$;
