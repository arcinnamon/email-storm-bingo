import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");
const TOKENS = ["blue", "yellow", "white", "silver", "black", "green"];

function token(name: string): string {
  const m = css.match(new RegExp("--" + name + ":\\s*(#[0-9a-fA-F]{6})"));
  if (!m) throw new Error("missing token --" + name);
  return m[1];
}

function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme", () => {
  it("has no prefers-color-scheme block", () => {
    expect(css).not.toContain("prefers-color-scheme");
  });

  it.each(TOKENS)("defines --%s", (name) => {
    expect(() => token(name)).not.toThrow();
  });

  it("uses Inter through a neutral font variable with a sans-serif fallback", () => {
    expect(css).toMatch(/--font-sans:[^;]*var\(--font-inter\)[^;]*sans-serif/);
    expect(readFileSync("app/layout.tsx", "utf8")).toMatch(/Inter\(/);
  });

  it("has no pixel font left in app/", () => {
    for (const f of ["app/layout.tsx", "app/globals.css"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/vt323|--font-pixel/i);
    }
  });

  it.each([
    ["green", "black"],
    ["black", "green"],
    ["white", "blue"],
    ["yellow", "blue"],
    ["black", "silver"],
  ])("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });
});
