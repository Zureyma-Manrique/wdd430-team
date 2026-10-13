import { describe, expect, it } from "vitest";
import { firstFieldErrors, readApiError } from "./error-body";

describe("readApiError", () => {
  it("reads the spec §6 error body, with the first message per field", async () => {
    const response = new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the highlighted fields",
          details: { fieldErrors: { rating: ["Too low", "Other"], comment: ["Too long"] } },
        },
      }),
    );
    expect(await readApiError(response)).toEqual({
      message: "Check the highlighted fields",
      fieldErrors: { rating: "Too low", comment: "Too long" },
    });
  });

  it("falls back to a generic message for anything else", async () => {
    expect((await readApiError(new Response("<html>oops</html>"))).message).toMatch(/something went wrong/i);
  });
});

describe("firstFieldErrors", () => {
  it("keeps only the first message", () => {
    expect(firstFieldErrors({ a: ["x", "y"], b: undefined })).toEqual({ a: "x", b: undefined });
  });
});
