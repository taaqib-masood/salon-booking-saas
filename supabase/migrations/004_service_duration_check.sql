-- Service durations drive the public slot generator; non-positive values made it loop forever.
-- NOT VALID: enforce on new writes without failing on any legacy rows.
ALTER TABLE services
  ADD CONSTRAINT services_duration_positive CHECK (duration > 0) NOT VALID;
