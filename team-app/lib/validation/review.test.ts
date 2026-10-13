import { describe, expect, it } from "vitest";
import { reviewCreateSchema, reviewReplySchema, reviewUpdateSchema } from "./review";

describe("reviewCreateSchema (FR-030)", () => {
  it("accepts 1 to 5 whole stars with an optional comment", () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating }).success).toBe(true);
    }
  });

  it("rejects 0, 6, fractions and a comment over 1,000 characters", () => {
    for (const rating of [0, 6, 4.5]) {
      expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating }).success).toBe(false);
    }
    expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating: 5, comment: "x".repeat(1001) }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating: 5, comment: "x".repeat(1000) }).success).toBe(true);
  });

  it("never accepts the author or walker from the client", () => {
    expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating: 5, authorId: "u_1" }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ walkId: "wk_1", rating: 5, walkerId: "w_1" }).success).toBe(false);
  });
});

describe("reviewUpdateSchema (FR-032)", () => {
  it("needs a field, and an empty comment clears it", () => {
    expect(reviewUpdateSchema.safeParse({}).success).toBe(false);
    expect(reviewUpdateSchema.parse({ comment: "" })).toEqual({ comment: null });
    expect(reviewUpdateSchema.safeParse({ walkId: "wk_2" }).success).toBe(false);
  });
});

describe("reviewReplySchema (FR-033)", () => {
  it("takes a reply of 1 to 500 characters", () => {
    expect(reviewReplySchema.safeParse({ reply: "Thanks!" }).success).toBe(true);
    expect(reviewReplySchema.safeParse({ reply: "   " }).success).toBe(false);
    expect(reviewReplySchema.safeParse({ reply: "y".repeat(501) }).success).toBe(false);
  });
});
