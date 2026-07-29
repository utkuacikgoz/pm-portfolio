import { describe, it, expect } from "vitest";
import { T } from "./theme";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS } from "./projects/projects";

// The site's first job is to be recruiter-skimmable, and the Monument Valley
// palette is pastel, where poor contrast fails silently and looks fine to the
// person who chose the colours. So the ratios are asserted, not eyeballed.

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const TEXT_TOKENS = ["ink", "inkSoft", "peri", "coral", "green", "mauve", "sand"] as const;

describe("palette contrast", () => {
  it.each(TEXT_TOKENS)("%s clears WCAG AA on both surfaces", (token) => {
    expect(contrast(T[token], T.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(T[token], T.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps white legible on every accent, for filled buttons", () => {
    for (const token of ["peri", "coral", "green", "mauve", "sand"] as const) {
      expect(contrast("#FFFFFF", T[token])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("gives every project a text-safe accent", () => {
    for (const p of [...PUBLISHED_PROJECTS, ...INDIE_PROJECTS]) {
      expect(contrast(p.accent, T.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  // The soft cousins exist for large 3D fills. If one ever gets used as text this
  // documents why that is wrong.
  it("documents that the soft cousins are decoration, not text", () => {
    for (const token of ["periSoft", "coralSoft", "greenSoft", "mauveSoft", "sandSoft"] as const) {
      expect(contrast(T[token], T.bg)).toBeLessThan(4.5);
    }
  });
});
