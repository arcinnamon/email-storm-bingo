import { expect, test, type Page } from "@playwright/test";

const KEY = "email-storm-bingo:game";

async function seedCard(page: Page) {
  await page.goto("/");
  await expect(page.locator(".bingo-cell")).toHaveCount(25);
  // Mark nothing but the free space, keep the card as generated.
  await page.evaluate((key) => {
    const game = JSON.parse(localStorage.getItem(key)!);
    game.marked = game.marked.map((_: boolean, i: number) => i === 12);
    localStorage.setItem(key, JSON.stringify(game));
  }, KEY);
  await page.reload();
  await expect(page.locator(".bingo-cell")).toHaveCount(25);
}

test("shows 25 squares and toggles one", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  await expect(cells.nth(12)).toHaveAttribute("aria-pressed", "true");
  await cells.nth(0).click();
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "true");
  await cells.nth(0).click();
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "false");
});

test("free space cannot be unmarked", async ({ page }) => {
  await page.goto("/");
  const free = page.locator(".bingo-cell").nth(12);
  await free.click();
  await expect(free).toHaveAttribute("aria-pressed", "true");
});

test("shows Bingo! when a line is completed", async ({ page }) => {
  await seedCard(page);
  const cells = page.locator(".bingo-cell");
  const banner = page.getByRole("status").getByText("Bingo!");
  for (const i of [10, 11, 13]) await cells.nth(i).click();
  await expect(banner).toHaveCount(0);
  await cells.nth(14).click();
  await expect(banner).toBeVisible();
});

test("New card asks first, then resets", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  await cells.nth(0).click();
  const before = await cells.allTextContents();

  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "New card" }).click();
  expect(await cells.allTextContents()).toEqual(before);
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "true");

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "New card" }).click();
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('.bingo-cell[aria-pressed="true"]')).toHaveCount(1);
});

test("card and marks survive a reload", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  await cells.nth(3).click();
  const before = await cells.allTextContents();
  await page.reload();
  await expect(cells).toHaveCount(25);
  expect(await cells.allTextContents()).toEqual(before);
  await expect(cells.nth(3)).toHaveAttribute("aria-pressed", "true");
});
