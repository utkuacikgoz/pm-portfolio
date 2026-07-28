import { describe, it, expect } from "vitest";
import {
  SPACING,
  WATER_GAP,
  EMP_COUNT,
  INDIE_INDEX,
  islandX,
  islandBaseZ,
  islandPosition,
  buildWorld,
} from "./geometry";
import { PUBLISHED_PROJECTS } from "../projects/projects";

describe("island layout math", () => {
  it("places employment islands evenly along the rail", () => {
    expect(islandX(0)).toBe(0);
    expect(islandX(1)).toBe(SPACING);
    expect(islandX(2)).toBe(2 * SPACING);
  });

  it("puts the indie island past the water gap", () => {
    // INDIE_INDEX === EMP_COUNT — the first index past the employment run.
    expect(islandX(INDIE_INDEX)).toBe((EMP_COUNT - 1) * SPACING + WATER_GAP);
    // ...which is strictly farther out than the last employment island.
    expect(islandX(INDIE_INDEX)).toBeGreaterThan(islandX(EMP_COUNT - 1));
  });

  it("weaves employment islands within a bounded Z band, indie island on-axis", () => {
    for (let i = 0; i < EMP_COUNT; i++) {
      expect(Math.abs(islandBaseZ(i))).toBeLessThanOrEqual(2.4 + 1e-9);
    }
    expect(islandBaseZ(INDIE_INDEX)).toBe(0);
  });

  it("islandPosition returns [x, 0, z] consistent with the component parts", () => {
    const [x, y, z] = islandPosition(3);
    expect(x).toBe(islandX(3));
    expect(y).toBe(0);
    expect(z).toBe(islandBaseZ(3));
  });
});

describe("buildWorld", () => {
  it("produces well-formed cubes for the published registry", () => {
    const cubes = buildWorld(PUBLISHED_PROJECTS);
    expect(cubes.length).toBeGreaterThan(0);
    for (const c of cubes) {
      expect(c.position).toHaveLength(3);
      expect(c.scale).toHaveLength(3);
      expect(c.position.every((n) => Number.isFinite(n))).toBe(true);
      expect(c.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("is deterministic — same registry in, identical geometry out", () => {
    const a = buildWorld(PUBLISHED_PROJECTS);
    const b = buildWorld(PUBLISHED_PROJECTS);
    expect(a).toEqual(b);
  });

  it("returns no cubes for an empty registry", () => {
    expect(buildWorld([])).toEqual([]);
  });
});
