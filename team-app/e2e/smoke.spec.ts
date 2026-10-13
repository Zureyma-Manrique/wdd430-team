import { expect, test, type Page } from "@playwright/test";

// Demo accounts created by `prisma/seed.ts`.
const PASSWORD = "paws-demo-2026";

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.locator("main form").getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("the walker directory lists walkers from the database", async ({ page }) => {
  await page.goto("/walkers");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});

test("signed-out visitors are sent to sign in, and protected APIs answer 401", async ({ page, request }) => {
  await page.goto("/walks");
  await expect(page).toHaveURL(/\/sign-in/);
  expect((await request.get("/api/walks")).status()).toBe(401);
  expect((await request.get("/api/dogs")).status()).toBe(401);
});

test("an unknown walker is a real 404", async ({ page }) => {
  const response = await page.goto("/walkers/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("an owner sees their dogs and walks", async ({ page }) => {
  await signIn(page, "jordan@example.com");
  await page.goto("/dogs");
  await expect(page.getByRole("heading", { name: "My dogs" })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.goto("/walks");
  await expect(page.getByRole("heading", { name: "My walks" })).toBeVisible();
  await expect(page.getByLabel("Status")).toBeVisible();
});

test("a walk that isn't yours is a real 404 (story C6)", async ({ page }) => {
  await signIn(page, "jordan@example.com");
  const response = await page.goto("/walks/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("a walker can't use owner-only endpoints", async ({ page }) => {
  await signIn(page, "sam@example.com");
  const response = await page.request.post("/api/reviews", {
    headers: { Origin: new URL(page.url()).origin },
    data: { walkId: "x", rating: 5 },
  });
  expect(response.status()).toBe(403);
});

test("a wrong password shows the generic error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("jordan@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.locator("main form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});
