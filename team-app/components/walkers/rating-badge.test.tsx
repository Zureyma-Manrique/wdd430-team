import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RatingBadge } from "./rating-badge";

describe("RatingBadge", () => {
  it("says 'No reviews yet' without a rating", () => {
    render(<RatingBadge averageRating={null} reviewCount={0} />);
    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
  });

  it("shows one decimal and a singular or plural review count", () => {
    const { rerender } = render(<RatingBadge averageRating={4.5} reviewCount={1} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText("(1 review)")).toBeInTheDocument();
    rerender(<RatingBadge averageRating={4} reviewCount={12} />);
    expect(screen.getByText(/4\.0/)).toBeInTheDocument();
    expect(screen.getByText("(12 reviews)")).toBeInTheDocument();
  });
});
