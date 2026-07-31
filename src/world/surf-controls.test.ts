import { describe, expect, it } from "vitest";
import { BOARD_CLEARANCE, DOUBLE_SPACE_WINDOW, boardFloatY, isDoubleSpacePress } from "./surf-controls";
import { WATER_Y, seaHeight } from "./geometry";

describe("surf controls", () => {
  it("recognizes a second Space press inside the trick window", () => {
    expect(isDoubleSpacePress(10.2, 10)).toBe(true);
    expect(isDoubleSpacePress(10 + DOUBLE_SPACE_WINDOW, 10)).toBe(true);
    expect(isDoubleSpacePress(10.4, 10)).toBe(false);
  });

  it("keeps a smoothed board above the real water surface", () => {
    expect(boardFloatY(-3.4, -4.2)).toBeCloseTo(-3.4 + BOARD_CLEARANCE);
    expect(boardFloatY(-3.4, -2.5)).toBe(-2.5);
  });

  it("never lets the board sink into the moving water field", () => {
    for (const x of [-60, 0, 60, 120, 220]) {
      for (const z of [-130, -58, 0, 58, 130]) {
        for (const time of [0, 1.25, 3.7, 8.4]) {
          const surface = WATER_Y + seaHeight(x, z, time);
          // This simulates a low-pass filter lagging behind a rising swell.
          expect(boardFloatY(surface, surface - 2)).toBeGreaterThanOrEqual(surface + BOARD_CLEARANCE);
        }
      }
    }
  });
});
