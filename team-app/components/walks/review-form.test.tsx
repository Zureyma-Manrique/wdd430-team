import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewForm } from "./review-form";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockClear();
});

describe("ReviewForm (story D1)", () => {
  it("asks for a rating before sending anything", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ReviewForm walkId="wk_1" walkerName="Sam" />);
    await user.click(screen.getByRole("button", { name: "Review Sam" }));
    await user.click(screen.getByRole("button", { name: "Post review" }));
    expect(screen.getByText("Choose a rating from 1 to 5 stars")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selects a rating with the keyboard and posts it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ review: {} }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ReviewForm walkId="wk_1" walkerName="Sam" />);
    await user.click(screen.getByRole("button", { name: "Review Sam" }));
    // Focus lands on the first star; the arrow keys move the selection.
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
    await user.type(screen.getByLabelText("Comment (optional)"), "Great with my anxious pup");
    await user.click(screen.getByRole("button", { name: "Post review" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/reviews");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      walkId: "wk_1",
      rating: 3,
      comment: "Great with my anxious pup",
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the server's message when the walk can't be reviewed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: "WALK_NOT_COMPLETED", message: "You can only review completed walks" } }),
          {
            status: 409,
          },
        ),
      ),
    );
    const user = userEvent.setup();
    render(<ReviewForm walkId="wk_1" walkerName="Sam" />);
    await user.click(screen.getByRole("button", { name: "Review Sam" }));
    await user.click(screen.getByRole("radio", { name: "5 stars" }));
    await user.click(screen.getByRole("button", { name: "Post review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You can only review completed walks");
  });
});
