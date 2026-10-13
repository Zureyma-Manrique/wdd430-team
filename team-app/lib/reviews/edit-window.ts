/*
 * FR-032: a review can be edited for 30 days after it was written (deleting is always allowed).
 * A plain module, so Route Handlers, data functions and pages share one rule.
 */
export const REVIEW_EDIT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function isWithinEditWindow(createdAt: Date | string, now: Date): boolean {
  return now.getTime() - new Date(createdAt).getTime() <= REVIEW_EDIT_WINDOW_MS;
}
