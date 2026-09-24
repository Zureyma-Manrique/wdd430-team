import { z } from "zod";
import {
  WALK_BOOKING_STATUSES,
  WALK_DURATIONS_MINUTES,
  WALK_STATUS_ACTIONS,
  type WalkDurationMinutes,
} from "@/lib/types";
import { entityIdSchema, optionalText } from "./common";

const HOUR_MS = 60 * 60 * 1000;
export const MIN_BOOKING_LEAD_MS = HOUR_MS;
export const MAX_BOOKING_LEAD_MS = 60 * 24 * HOUR_MS;
export const BOOKING_WINDOW_MESSAGE = "Walks must be booked between 1 hour and 60 days in advance";

export const durationMinutesSchema = z
  .number()
  .int()
  .refine(
    (value): value is WalkDurationMinutes =>
      (WALK_DURATIONS_MINUTES as readonly number[]).includes(value),
    { error: "Duration must be 30, 45, or 60 minutes" },
  );

/** Start time must carry an explicit UTC offset and fall inside the booking window (FR-021). */
export const walkStartAtSchema = z.iso
  .datetime({ offset: true, error: "Enter a valid date and time" })
  .refine(
    (value) => {
      const leadMs = new Date(value).getTime() - Date.now();
      return leadMs >= MIN_BOOKING_LEAD_MS && leadMs <= MAX_BOOKING_LEAD_MS;
    },
    { error: BOOKING_WINDOW_MESSAGE },
  );

// POST /api/walks (FR-020). `ownerId` is never accepted from the client; it comes from the session.
export const walkCreateSchema = z.strictObject({
  dogId: entityIdSchema,
  walkerId: entityIdSchema,
  startAt: walkStartAtSchema,
  durationMinutes: durationMinutesSchema,
  pickupNotes: optionalText(500),
});
export type WalkCreateInput = z.infer<typeof walkCreateSchema>;

// PATCH /api/walks/[id] (FR-024)
export const walkUpdateSchema = z
  .strictObject({
    startAt: walkStartAtSchema,
    durationMinutes: durationMinutesSchema,
    pickupNotes: optionalText(500),
  })
  .partial();
export type WalkUpdateInput = z.infer<typeof walkUpdateSchema>;

// POST /api/walks/[id]/status (FR-023)
export const walkStatusChangeSchema = z.strictObject({
  action: z.enum(WALK_STATUS_ACTIONS),
  reason: optionalText(500),
  sessionNotes: optionalText(1000),
});
export type WalkStatusChangeInput = z.infer<typeof walkStatusChangeSchema>;

const timeZoneSchema = z
  .string()
  .max(64)
  .refine(
    (value) => {
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    },
    { error: "Unknown time zone" },
  );

// GET /api/walks query string (FR-025)
export const walkListQuerySchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  tz: timeZoneSchema.default("UTC"),
  status: z
    .string()
    .max(200)
    .optional()
    .transform((value) => (value ? value.split(",") : undefined))
    .pipe(z.array(z.enum(WALK_BOOKING_STATUSES)).optional()),
  dogId: entityIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type WalkListQuery = z.infer<typeof walkListQuerySchema>;
