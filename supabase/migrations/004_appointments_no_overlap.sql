-- Prevent double-booking a stylist: active appointments for one staff member may not overlap.
-- Ranges are half-open, so back-to-back slots (10:00-11:00, 11:00-12:00) are allowed.
-- A slot ending past midnight (end_time < time_slot) runs into the next day.
-- Fails if overlapping active appointments already exist; cancel or reschedule those first.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_staff_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tsrange(
      date + time_slot,
      CASE WHEN end_time < time_slot THEN date + 1 + end_time ELSE date + COALESCE(end_time, time_slot) END
    ) WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'in_progress'));
