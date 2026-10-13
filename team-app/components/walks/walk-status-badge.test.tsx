import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WALK_BOOKING_STATUSES } from "@/lib/types";
import { WalkStatusBadge } from "./walk-status-badge";

describe("WalkStatusBadge", () => {
  it("always shows the status as text, never by colour alone", () => {
    for (const status of WALK_BOOKING_STATUSES) {
      const { unmount } = render(<WalkStatusBadge status={status} />);
      expect(screen.getByText(/\S/)).toBeInTheDocument();
      unmount();
    }
  });

  it("labels a pending request as Requested", () => {
    render(<WalkStatusBadge status="PENDING" />);
    expect(screen.getByText("Requested")).toBeInTheDocument();
  });
});
