import { describe, expect, it } from "vitest";
import { availableActions, canReschedule, checkTransition } from "./transitions";

const now = new Date("2026-10-13T12:00:00.000Z");
// Literal values on purpose: the tests must fail if the rules in transitions.ts change.
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();

describe("checkTransition (FR-023)", () => {
  it("lets the walker accept or decline a pending request", () => {
    expect(checkTransition("accept", { status: "PENDING", startAt: at(86_400_000) }, "WALKER", now)).toEqual({
      ok: true,
      to: "CONFIRMED",
    });
    expect(checkTransition("decline", { status: "PENDING", startAt: at(86_400_000) }, "WALKER", now)).toEqual({
      ok: true,
      to: "DECLINED",
    });
  });

  it("rejects the wrong role", () => {
    expect(checkTransition("accept", { status: "PENDING", startAt: at(1e8) }, "OWNER", now)).toEqual({
      ok: false,
      reason: "WRONG_ROLE",
    });
  });

  it("rejects an action the status does not allow", () => {
    expect(checkTransition("complete", { status: "CONFIRMED", startAt: at(1e8) }, "WALKER", now)).toEqual({
      ok: false,
      reason: "WRONG_STATE",
    });
    expect(checkTransition("cancel", { status: "COMPLETED", startAt: at(-1e8) }, "OWNER", now)).toEqual({
      ok: false,
      reason: "WRONG_STATE",
    });
  });

  it("lets either side cancel a pending or confirmed walk", () => {
    for (const status of ["PENDING", "CONFIRMED"] as const) {
      for (const role of ["OWNER", "WALKER"] as const) {
        expect(checkTransition("cancel", { status, startAt: at(1e8) }, role, now).ok).toBe(true);
      }
    }
  });

  it("allows starting only from 15 minutes before the start time", () => {
    expect(
      checkTransition("start", { status: "CONFIRMED", startAt: at(FIFTEEN_MINUTES_MS + 1000) }, "WALKER", now),
    ).toEqual({
      ok: false,
      reason: "TOO_EARLY",
    });
    expect(checkTransition("start", { status: "CONFIRMED", startAt: at(FIFTEEN_MINUTES_MS) }, "WALKER", now)).toEqual({
      ok: true,
      to: "IN_PROGRESS",
    });
  });
});

describe("availableActions", () => {
  it("shows a walker accept and decline on a request, and an owner only cancel", () => {
    const walk = { status: "PENDING" as const, startAt: at(1e8) };
    expect(availableActions(walk, "WALKER", now)).toEqual(["accept", "decline", "cancel"]);
    expect(availableActions(walk, "OWNER", now)).toEqual(["cancel"]);
  });

  it("offers nothing on a finished walk", () => {
    expect(availableActions({ status: "COMPLETED", startAt: at(-1e8) }, "WALKER", now)).toEqual([]);
  });
});

describe("canReschedule (FR-024)", () => {
  it("needs a pending or confirmed walk that starts more than 2 hours away", () => {
    expect(canReschedule({ status: "PENDING", startAt: at(TWO_HOURS_MS + 1000) }, now)).toBe(true);
    expect(canReschedule({ status: "CONFIRMED", startAt: at(TWO_HOURS_MS + 1000) }, now)).toBe(true);
    expect(canReschedule({ status: "CONFIRMED", startAt: at(TWO_HOURS_MS) }, now)).toBe(false);
    expect(canReschedule({ status: "IN_PROGRESS", startAt: at(1e9) }, now)).toBe(false);
    expect(canReschedule({ status: "CANCELLED", startAt: at(1e9) }, now)).toBe(false);
  });
});
