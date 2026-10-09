import type { UserRole, WalkBookingStatus, WalkStatusAction } from "@/lib/types";

/*
 * The legal walk status changes (FR-023). Anything else is a `409`. A plain module with no
 * server-only code, so Route Handlers, data functions and pages all use the same table.
 *
 *   PENDING → CONFIRMED | DECLINED      walker (accept, decline)
 *   PENDING | CONFIRMED → CANCELLED     owner or walker (cancel)
 *   CONFIRMED → IN_PROGRESS             walker (start), from 15 minutes before the start time
 *   IN_PROGRESS → COMPLETED             walker (complete)
 *   PENDING → EXPIRED                   system (not built yet; see README "Known issues")
 */

export const START_EARLY_MS = 15 * 60 * 1000;

interface Transition {
  from: readonly WalkBookingStatus[];
  to: WalkBookingStatus;
  roles: readonly UserRole[];
}

export const WALK_TRANSITIONS: Record<WalkStatusAction, Transition> = {
  accept: { from: ["PENDING"], to: "CONFIRMED", roles: ["WALKER"] },
  decline: { from: ["PENDING"], to: "DECLINED", roles: ["WALKER"] },
  cancel: { from: ["PENDING", "CONFIRMED"], to: "CANCELLED", roles: ["OWNER", "WALKER"] },
  start: { from: ["CONFIRMED"], to: "IN_PROGRESS", roles: ["WALKER"] },
  complete: { from: ["IN_PROGRESS"], to: "COMPLETED", roles: ["WALKER"] },
};

export type TransitionCheck =
  | { ok: true; to: WalkBookingStatus }
  | { ok: false; reason: "WRONG_ROLE" | "WRONG_STATE" | "TOO_EARLY" };

interface WalkTiming {
  status: WalkBookingStatus;
  startAt: Date | string;
}

/** Whether `role` may apply `action` to this walk at time `now`. */
export function checkTransition(action: WalkStatusAction, walk: WalkTiming, role: UserRole, now: Date): TransitionCheck {
  const transition = WALK_TRANSITIONS[action];
  if (!transition.roles.includes(role)) return { ok: false, reason: "WRONG_ROLE" };
  if (!transition.from.includes(walk.status)) return { ok: false, reason: "WRONG_STATE" };
  if (action === "start" && now.getTime() < new Date(walk.startAt).getTime() - START_EARLY_MS) {
    return { ok: false, reason: "TOO_EARLY" };
  }
  return { ok: true, to: transition.to };
}

const ACTION_ORDER: readonly WalkStatusAction[] = ["accept", "decline", "start", "complete", "cancel"];

/** The buttons to show for a walk, in display order. Computed on the server, so it needs no client clock. */
export function availableActions(walk: WalkTiming, role: UserRole, now: Date): WalkStatusAction[] {
  return ACTION_ORDER.filter((action) => checkTransition(action, walk, role, now).ok);
}
