import { describe, expect, it } from "vitest";
import { startOfDayUtc, startOfNextDayUtc } from "./dates";

describe("startOfDayUtc", () => {
  it("is midnight UTC for the UTC zone", () => {
    expect(startOfDayUtc("2026-10-13", "UTC").toISOString()).toBe("2026-10-13T00:00:00.000Z");
  });

  it("converts a local calendar day to the UTC instant it starts (Denver is UTC-6 in October)", () => {
    expect(startOfDayUtc("2026-10-13", "America/Denver").toISOString()).toBe("2026-10-13T06:00:00.000Z");
  });

  it("follows a daylight-saving change (Denver moves back on 2026-11-01)", () => {
    expect(startOfDayUtc("2026-11-01", "America/Denver").toISOString()).toBe("2026-11-01T06:00:00.000Z");
    expect(startOfDayUtc("2026-11-02", "America/Denver").toISOString()).toBe("2026-11-02T07:00:00.000Z");
  });
});

describe("startOfNextDayUtc", () => {
  it("makes a 'to' date include every walk on its last day", () => {
    expect(startOfNextDayUtc("2026-10-13", "America/Denver").toISOString()).toBe("2026-10-14T06:00:00.000Z");
  });

  it("is 25 hours after the day start on a day with a clock change", () => {
    const start = startOfDayUtc("2026-11-01", "America/Denver").getTime();
    const next = startOfNextDayUtc("2026-11-01", "America/Denver").getTime();
    expect((next - start) / 3_600_000).toBe(25);
  });
});
