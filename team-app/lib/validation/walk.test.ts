import { describe, expect, it } from "vitest";
import { walkCreateSchema, walkListQuerySchema, walkUpdateSchema } from "./walk";

const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();
const valid = { dogId: "dog_1", walkerId: "w_1", startAt: inHours(48), durationMinutes: 30 };

describe("walkCreateSchema (FR-020, FR-021)", () => {
  it("accepts a booking inside the 1 hour to 60 day window", () => {
    expect(walkCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a start time that is too soon, too far away, or has no UTC offset", () => {
    expect(walkCreateSchema.safeParse({ ...valid, startAt: inHours(0.5) }).success).toBe(false);
    expect(walkCreateSchema.safeParse({ ...valid, startAt: inHours(61 * 24) }).success).toBe(false);
    expect(walkCreateSchema.safeParse({ ...valid, startAt: "2030-01-01T10:00:00" }).success).toBe(false);
  });

  it("allows only 30, 45 and 60 minutes", () => {
    for (const durationMinutes of [30, 45, 60]) {
      expect(walkCreateSchema.safeParse({ ...valid, durationMinutes }).success).toBe(true);
    }
    expect(walkCreateSchema.safeParse({ ...valid, durationMinutes: 20 }).success).toBe(false);
  });

  it("rejects fields a client must not send, such as ownerId or status", () => {
    expect(walkCreateSchema.safeParse({ ...valid, ownerId: "o_1" }).success).toBe(false);
    expect(walkCreateSchema.safeParse({ ...valid, status: "CONFIRMED" }).success).toBe(false);
  });
});

describe("walkUpdateSchema (FR-024)", () => {
  it("needs at least one field and rejects unknown ones", () => {
    expect(walkUpdateSchema.safeParse({}).success).toBe(false);
    expect(walkUpdateSchema.safeParse({ startAt: inHours(48) }).success).toBe(true);
    expect(walkUpdateSchema.safeParse({ status: "CONFIRMED" }).success).toBe(false);
  });

  it("lets pickup notes be cleared with an empty string", () => {
    expect(walkUpdateSchema.parse({ pickupNotes: "" })).toEqual({ pickupNotes: null });
  });
});

describe("walkListQuerySchema (FR-025)", () => {
  it("splits a comma-separated status list and validates it", () => {
    expect(walkListQuerySchema.parse({ status: "PENDING,CONFIRMED" }).status).toEqual(["PENDING", "CONFIRMED"]);
    expect(walkListQuerySchema.safeParse({ status: "NOPE" }).success).toBe(false);
  });

  it("validates dates and time zones, and defaults to UTC", () => {
    expect(walkListQuerySchema.parse({}).tz).toBe("UTC");
    expect(walkListQuerySchema.safeParse({ from: "garbage" }).success).toBe(false);
    expect(walkListQuerySchema.safeParse({ tz: "Mars/Base" }).success).toBe(false);
    expect(walkListQuerySchema.safeParse({ from: "2026-10-01", to: "2026-10-31", tz: "America/Denver" }).success).toBe(
      true,
    );
  });
});
