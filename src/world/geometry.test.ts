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
  structureTop,
  EMBLEM_HOVER,
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

describe("island silhouettes", () => {
  // Every published island has to hold its own from the rail camera. Mestores
  // and Apollo used to top out at 2.5 against an 8.4-wide island, so two of the
  // five read as a disc with cubes on it while their emblems floated unmoored.
  const MIN_PRESENCE = 4.5;

  it("gives every published structure real vertical presence", () => {
    for (const project of PUBLISHED_PROJECTS) {
      expect(structureTop(project.structure)).toBeGreaterThanOrEqual(MIN_PRESENCE);
    }
  });

  it("floats each emblem clear of its own structure", () => {
    // The tower used to punch through its emblem: 9.1 of spire under a 8.5 hover.
    for (const project of PUBLISHED_PROJECTS) {
      expect(EMBLEM_HOVER[project.structure]).toBeGreaterThan(
        structureTop(project.structure) + 1
      );
    }
  });

  it("does not let the skyline decay along the travel order", () => {
    // Heights descending monotonically made the world read as running out of
    // steam rather than as five distinct places.
    const heights = PUBLISHED_PROJECTS.map((p) => structureTop(p.structure));
    const strictlyDescending = heights.every((h, i) => i === 0 || h < heights[i - 1]);
    expect(strictlyDescending).toBe(false);
  });
});
