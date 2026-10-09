-- Walk end time + database-level protection against double-booking a walker (spec section 5).

-- 1. `endAt` = `startAt` + duration. Added nullable, backfilled for existing rows, then required.
ALTER TABLE "WalkBooking" ADD COLUMN "endAt" TIMESTAMPTZ(3);
UPDATE "WalkBooking" SET "endAt" = "startAt" + ("durationMinutes" * INTERVAL '1 minute');
ALTER TABLE "WalkBooking" ALTER COLUMN "endAt" SET NOT NULL;

-- 2. A walker can't have two active walks whose time ranges overlap (FR-022). The constraint is
--    enforced by Postgres itself, so two requests racing for the same slot can't both succeed.
--    `btree_gist` lets one GiST index combine an equality test (walkerId) with a range overlap.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "WalkBooking"
  ADD CONSTRAINT "WalkBooking_no_overlap"
  EXCLUDE USING gist (
    "walkerId" WITH =,
    tstzrange("startAt", "endAt") WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS'));

-- 3. Sanity checks that don't depend on application code.
ALTER TABLE "WalkBooking" ADD CONSTRAINT "WalkBooking_end_after_start" CHECK ("endAt" > "startAt");
ALTER TABLE "WalkBooking" ADD CONSTRAINT "WalkBooking_duration_allowed" CHECK ("durationMinutes" IN (30, 45, 60));
