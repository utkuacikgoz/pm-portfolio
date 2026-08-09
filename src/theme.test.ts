import { describe, expect, it } from "vitest";
import { T, TYPE, paletteColor, textAccent } from "./theme";
import { PROJECTS } from "./projects/projects";

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("palette contract", () => {
  it("keeps the supplied main and taupe colors stable", () => {
    expect(T).toMatchObject({
      forest: "#2C4832",
      coral: "#D76F53",
      mauve: "#C57EC2",
      blue: "#6273BF",
      ink: "#1D1816",
      text: "#FBFAF9",
    });
  });

  it("normalizes historical case-study accents into the active palette", () => {
    expect(paletteColor("#6E86D6")).toBe(T.blue);
    expect(paletteColor("#E0A45C")).toBe(T.gold);
    expect(paletteColor("#E7684A")).toBe(T.coral);
    expect(paletteColor("#CB7BC7")).toBe(T.mauve);
    expect(paletteColor("#3FA46A")).toBe(T.seafoam);
  });

  it("uses only active palette accents for project surfaces", () => {
    const accents = new Set([T.blue, T.gold, T.coral, T.mauve, T.seafoam]);
    expect(PROJECTS.every((project) => accents.has(project.accent))).toBe(true);
  });
});

describe("type scale", () => {
  it("has strictly ascending steps", () => {
    const steps = Object.values(TYPE);
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
  });

  it("uses no raw numeric font sizes anywhere in the UI", () => {
    // The scale is only worth having if it is the only way to set a size. This
    // reads the source rather than trusting review: the UI previously drifted to
    // twenty sizes, four of them invisible half-steps.
    //
    // import.meta.glob rather than node:fs, so this stays inside the app's
    // browser-typed project and needs no node types.
    const sources = import.meta.glob("./**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;

    const offenders: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      if (/\.test\.tsx?$/.test(file)) continue;
      source.split("\n").forEach((line, i) => {
        // clamp() sizes on the hero are fluid by design, not steps.
        if (/fontSize[:=]\s*"?[0-9]/.test(line) && !line.includes("clamp(")) {
          offenders.push(`${file}:${i + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});

describe("text contrast", () => {
  const AA_BODY = 4.5;
  const surfaces = { ink: T.ink, inkRaised: T.inkRaised };

  it("keeps the taupe text ladder readable on both panel surfaces", () => {
    for (const surface of Object.values(surfaces)) {
      for (const fg of [T.text, T.textSoft, T.textMuted]) {
        expect(contrast(fg, surface)).toBeGreaterThanOrEqual(AA_BODY);
      }
    }
  });

  it("returns an AA-passing colour for every project accent rendered as text", () => {
    // Raw blue is 3.43 on inkRaised: fine on lit 3D geometry, not fine as an
    // 11px section label. textAccent is what call sites must use for text.
    for (const project of PROJECTS) {
      for (const surface of Object.values(surfaces)) {
        expect(contrast(textAccent(project.accent), surface)).toBeGreaterThanOrEqual(AA_BODY);
      }
    }
  });

  it("lifts the accents that fail as text and leaves the rest untouched", () => {
    expect(textAccent(T.blue)).not.toBe(T.blue);
    expect(contrast(T.blue, T.inkRaised)).toBeLessThan(AA_BODY);
    expect(contrast(textAccent(T.blue), T.inkRaised)).toBeGreaterThanOrEqual(AA_BODY);

    // Already comfortable, so they pass straight through.
    for (const safe of [T.gold, T.sage, T.amber, T.seafoam, T.mauve, T.coral]) {
      expect(textAccent(safe)).toBe(safe);
    }
  });

  it("normalizes a legacy accent before making it text-safe", () => {
    expect(textAccent("#6E86D6")).toBe(textAccent(T.blue));
  });

  it("keeps in-world scrims on the taupe ink ladder, not blue-black", () => {
    for (const scrim of [T.scrimSoft, T.scrim, T.scrimStrong]) {
      expect(scrim).toMatch(/^rgba\(29,24,22,/);
    }
  });
});
