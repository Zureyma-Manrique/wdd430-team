/** Shared keyboard focus indicator (WCAG 2.4.7) for links and buttons. Form controls use a tighter offset. */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Inline text link (e.g. "← All walkers"). */
export const textLinkClasses = `rounded text-sm font-medium text-primary underline-offset-4 hover:underline ${focusRing}`;
