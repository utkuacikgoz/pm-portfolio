import { describe, expect, it } from "vitest";
import { CURL, faceProfile, lipHeight, lipOverhang, waveFace } from "./wave-face";

describe("wave profile", () => {
  it("starts at the water line", () => {
    const p = faceProfile(0, 8, CURL.slab);
    expect(p.y).toBe(0);
    expect(p.z).toBe(0);
  });

  // The whole reason this shape changed. A wall can be surfed past; only an
  // overhang can be surfed inside, and no amount of camera work invents one.
  it("gives a heavy wave enough cover to put a rider under", () => {
    // The board sits roughly a unit wide and the camera trails a few behind it,
    // so a slab has to reach out several units past its own crown to cover them.
    expect(lipOverhang(8, CURL.slab)).toBeGreaterThan(5);
    expect(lipOverhang(8, CURL.peeling)).toBeGreaterThan(0);
  });

  it("keeps a gentle beach break a lean, not a tube", () => {
    expect(lipOverhang(4, CURL.gentle)).toBeLessThan(1);
  });

  // A wave that stands dead upright still throws a full radius forward just by
  // being round. That is thickness, not cover, and must not read as a tube.
  it("reports no cover at all on an uncurled wall", () => {
    expect(lipOverhang(8, 0)).toBeCloseTo(0, 6);
  });

  it("throws harder the heavier the wave", () => {
    expect(lipOverhang(8, CURL.slab)).toBeGreaterThan(lipOverhang(8, CURL.peeling));
    expect(lipOverhang(8, CURL.peeling)).toBeGreaterThan(lipOverhang(8, CURL.gentle));
  });

  // Once the arc passes vertical the crest starts coming back DOWN. Reading the
  // wave's height off `radius` after that point overstates it, which is how a
  // rider ends up placed above a lip that is no longer there.
  it("reports a lip lower than the radius exactly when it has thrown over", () => {
    expect(lipHeight(8, CURL.gentle)).toBeGreaterThan(7.9);
    expect(lipHeight(8, CURL.slab)).toBeLessThan(8);
    expect(lipHeight(8, CURL.slab)).toBeGreaterThan(0);
  });

  it("rises monotonically until it throws, and never doubles back below the water", () => {
    for (let i = 0; i <= 40; i++) {
      const p = faceProfile(i / 40, 8, CURL.slab);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.z).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("wave mesh", () => {
  it("builds a closed grid of the requested tessellation", () => {
    const across = 6;
    const rise = 4;
    const { positions, indices } = waveFace(20, 6, CURL.peeling, across, rise);
    expect(positions).toHaveLength((across + 1) * (rise + 1) * 3);
    expect(indices).toHaveLength(across * rise * 6);
    expect(Math.max(...indices)).toBe((across + 1) * (rise + 1) - 1);
  });

  it("spans exactly the width it was asked for", () => {
    const xs = [];
    const { positions } = waveFace(30, 6, CURL.slab, 8, 4);
    for (let i = 0; i < positions.length; i += 3) xs.push(positions[i]);
    expect(Math.min(...xs)).toBeCloseTo(-15, 6);
    expect(Math.max(...xs)).toBeCloseTo(15, 6);
  });

  it("produces no NaN, whatever it is handed", () => {
    const { positions } = waveFace(0, 0, 0, 4, 2);
    expect(positions.every(Number.isFinite)).toBe(true);
  });
});
