import { expect, test, type Page } from "@playwright/test";
import { FREE_INDEX, FREE_LABEL } from "../../lib/bingo";
import { PHRASES } from "../../lib/phrases";
import { STORAGE_KEY } from "../../lib/bingo-storage";

const SIZES = [
  { name: "360px phone", width: 360, height: 740 },
  { name: "375px phone", width: 375, height: 812 },
  { name: "320px phone", width: 320, height: 640 },
  { name: "desktop", width: 1280, height: 800 },
];

// Two decks of 24 phrases that together cover every phrase in the pool.
function decks(): string[][] {
  const per = FREE_INDEX * 2;
  return [PHRASES.slice(0, per), PHRASES.slice(-per)];
}

test("the test decks cover every phrase in the pool", () => {
  expect(new Set(decks().flat())).toEqual(new Set(PHRASES));
});

async function loadDeck(page: Page, phrases: string[]) {
  const cells = [...phrases.slice(0, FREE_INDEX), FREE_LABEL, ...phrases.slice(FREE_INDEX)];
  const marked = cells.map((_, i) => i === FREE_INDEX);
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify({ cells, marked })],
  );
  await page.goto("/");
  await expect(page.locator(".bingo-cell")).toHaveCount(25);
}

for (const size of SIZES) {
  test("every space is square at " + size.name, async ({ browser }) => {
    for (const deck of decks()) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
      const page = await context.newPage();
      await loadDeck(page, deck);
      const boxes = await page.locator(".bingo-cell").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height, text: el.textContent };
        }),
      );
      for (const b of boxes) {
        expect(Math.abs(b.w - b.h), b.text + ": " + b.w + "x" + b.h).toBeLessThanOrEqual(1);
      }
      await context.close();
    }
  });
}

for (const size of SIZES.filter((s) => s.width < 1000)) {
  test("no phrase is clipped at " + size.name, async ({ browser }) => {
    for (const deck of decks()) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
      const page = await context.newPage();
      await loadDeck(page, deck);
      const bad = await page.locator(".bingo-cell").evaluateAll((els) =>
        els
          .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.textContent),
      );
      expect(bad).toEqual([]);
      await context.close();
    }
  });
}

test("bingo spaces use Arial while the title keeps its font", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  const families = await cells.evaluateAll((els) => els.map((el) => getComputedStyle(el).fontFamily));
  for (const f of families) {
    expect(f.toLowerCase().startsWith("arial")).toBe(true);
    expect(f).not.toContain("VT323");
  }
  const title = await page.locator("h1").first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(title.toLowerCase()).not.toMatch(/^arial/);
});

test("each space has the full phrase as its accessible name", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator(".bingo-cell");
  await expect(cells).toHaveCount(25);
  const pairs = await cells.evaluateAll((els) =>
    els.map((el) => ({ label: el.getAttribute("aria-label"), title: el.getAttribute("title"), text: el.textContent })),
  );
  for (const p of pairs) {
    expect(p.label).toBe(p.text);
    expect(p.title).toBe(p.text);
  }
  for (const p of pairs) {
    await expect(page.getByRole("button", { name: p.text ?? "", exact: true })).toBeVisible();
  }
});
