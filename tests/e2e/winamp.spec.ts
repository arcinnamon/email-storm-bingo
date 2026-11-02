import { expect, test } from "@playwright/test";

function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return "rgb(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ")";
}

test("title and decorative chrome", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Reply-all storm bingo");
  await expect(page.getByRole("heading", { level: 1, name: "Reply-all storm bingo" })).toBeVisible();
  await expect(page.getByTestId("titlebar")).toHaveAttribute("aria-hidden", "true");
});

test("cells and button use the Winamp palette", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect(cells.nth(0)).toHaveCSS("background-color", rgb("#0a0a0a"));
  await expect(cells.nth(0)).toHaveCSS("color", rgb("#00ff3c"));
  const size = await cells.nth(0).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(12);
  await cells.nth(0).click();
  await expect(cells.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(cells.nth(0)).toHaveCSS("background-color", rgb("#00ff3c"));
  await expect(cells.nth(0)).toHaveCSS("color", rgb("#0a0a0a"));
  await expect(page.getByRole("button", { name: "New card" })).toHaveCSS("background-color", rgb("#c8c8d0"));
});

test("fits 375px and shows a yellow focus ring", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/");
  await expect(page.locator(".bingo-cell")).toHaveCount(25);
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(fits).toBe(true);
  await page.keyboard.press("Tab");
  const first = page.locator(".bingo-cell").first();
  await expect(first).toBeFocused();
  await expect(first).toHaveCSS("outline-color", rgb("#ffd34d"));
});
