import { describe, expect, it } from "vitest";
import { isWithinEditWindow } from "./edit-window";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000; // literal on purpose, so the rule can't drift unnoticed
const now = new Date("2026-10-13T12:00:00.000Z");

describe("isWithinEditWindow (FR-032)", () => {
  it("allows editing for 30 days", () => {
    expect(isWithinEditWindow(new Date(now.getTime() - 3 * 86_400_000), now)).toBe(true);
    expect(isWithinEditWindow(new Date(now.getTime() - THIRTY_DAYS_MS), now)).toBe(true);
  });

  it("closes after 30 days, and accepts an ISO string", () => {
    expect(isWithinEditWindow(new Date(now.getTime() - THIRTY_DAYS_MS - 1), now)).toBe(false);
    expect(isWithinEditWindow("2026-08-01T00:00:00.000Z", now)).toBe(false);
  });
});
