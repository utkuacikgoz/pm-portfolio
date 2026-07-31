import { describe, expect, it } from "vitest";
import { T, paletteColor } from "./theme";
import { PROJECTS } from "./projects/projects";

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
