import { describe, expect, it } from "vitest";
import {
  BOARD_CLEARANCE,
  DOUBLE_SPACE_WINDOW,
  boardFloatY,
  isDoubleSpacePress,
  CRUISE_SPEED,
  MAX_SLIP,
  SPRAY_MIN_SPEED,
  CHASE_DAMPING_RATIO,
  paceRatio,
  wrapAngle,
  turnRate,
  courseChase,
  clampSlip,
  cameraFov,
  cameraDistance,
  cameraHeight,
  cameraLookHeight,
  chaseStiffness,
  chaseDamping,
  sprayInterval,
} from "./surf-controls";
import { WATER_Y, seaHeight, seaSlopeX, seaSlopeZ } from "./geometry";

/** Speeds spanning a standstill to past cruising pace. */
const SPEEDS = [0, 3, 9, 14, 20, CRUISE_SPEED, CRUISE_SPEED * 1.5];

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

describe("handling curves", () => {
  it("normalizes pace to 0..1 and saturates past cruising speed", () => {
    expect(paceRatio(0)).toBe(0);
    expect(paceRatio(CRUISE_SPEED)).toBe(1);
    expect(paceRatio(CRUISE_SPEED * 3)).toBe(1);
    expect(paceRatio(-CRUISE_SPEED)).toBe(1); // reversing is still pace
  });

  it("opens the turning arc as pace builds", () => {
    // A surfer pivots on the spot at a crawl and commits to a long arc at speed.
    // If this ever inverts, fast carving becomes twitchy.
    const rates = SPEEDS.map((s) => turnRate(1, s));
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
    expect(turnRate(-1, 10)).toBeCloseTo(-turnRate(1, 10));
    expect(turnRate(0, 10)).toBe(0);
  });

  it("lets the tail wash out more the faster you go", () => {
    // courseChase is how fast travel catches up to the nose: lower means more slip.
    for (let i = 1; i < SPEEDS.length; i++) {
      expect(courseChase(SPEEDS[i])).toBeLessThanOrEqual(courseChase(SPEEDS[i - 1]));
    }
    expect(courseChase(0)).toBeGreaterThan(courseChase(CRUISE_SPEED));
  });

  it("never lets the board slip further than MAX_SLIP, including across the wrap", () => {
    for (const heading of [0, 1.5, Math.PI - 0.05, -Math.PI + 0.05, 3.1]) {
      for (const offset of [-3, -1, -MAX_SLIP, 0, MAX_SLIP, 1, 3]) {
        const held = clampSlip(heading, wrapAngle(heading - offset));
        expect(Math.abs(wrapAngle(heading - held))).toBeLessThanOrEqual(MAX_SLIP + 1e-9);
      }
    }
  });

  it("wraps angles into [-PI, PI]", () => {
    expect(wrapAngle(0)).toBeCloseTo(0);
    expect(wrapAngle(Math.PI * 2 + 0.4)).toBeCloseTo(0.4);
    expect(Math.abs(wrapAngle(Math.PI * 3))).toBeCloseTo(Math.PI);
  });

  it("throws no spray below a walking pace", () => {
    expect(sprayInterval(0)).toBe(Infinity);
    expect(sprayInterval(SPRAY_MIN_SPEED)).toBe(Infinity);
    expect(sprayInterval(CRUISE_SPEED)).toBeLessThan(0.1);
    // Faster means more droplets, never fewer.
    expect(sprayInterval(CRUISE_SPEED)).toBeLessThan(sprayInterval(SPRAY_MIN_SPEED + 4));
  });
});

describe("chase camera", () => {
  // THE regression test for this rig. The camera looked down at 26.6 degrees
  // while its vertical half-FOV was 22.5, so the horizon sat ABOVE the top edge
  // of the frame at every speed: no skyline, no wave relief, and an ocean that
  // read as a flat teal plane. Pitch must stay inside the half-FOV or the sea
  // silently stops existing.
  it("keeps the horizon inside the frame at every speed", () => {
    for (const riding of [false, true]) {
      for (const speed of SPEEDS) {
        const drop = cameraHeight(speed, riding) - cameraLookHeight(speed, riding);
        const pitch = Math.atan2(drop, cameraDistance(speed, riding));
        const halfFov = ((cameraFov(speed, 0) / 2) * Math.PI) / 180;
        expect(pitch).toBeLessThan(halfFov);
      }
    }
  });

  it("falls back, drops toward the water and widens the lens as pace builds", () => {
    expect(cameraDistance(CRUISE_SPEED, false)).toBeGreaterThan(cameraDistance(0, false));
    expect(cameraHeight(CRUISE_SPEED, false)).toBeLessThan(cameraHeight(0, false));
    expect(cameraLookHeight(CRUISE_SPEED)).toBeLessThan(cameraLookHeight(0));
    expect(cameraFov(CRUISE_SPEED, 0)).toBeGreaterThan(cameraFov(0, 0));
  });

  it("sits the ride camera above the wave face, not inside it", () => {
    // Dropped to free-surf height on a drop-in, the camera ended up inside the
    // breaking wave: the frame filled with turquoise and the board vanished.
    for (const speed of SPEEDS) {
      expect(cameraHeight(speed, true)).toBeGreaterThan(cameraHeight(speed, false));
    }
  });

  it("stays just under critical damping, so it settles without ringing", () => {
    for (const speed of SPEEDS) {
      const k = chaseStiffness(speed);
      expect(chaseDamping(k)).toBeCloseTo(2 * CHASE_DAMPING_RATIO * Math.sqrt(k));
      expect(CHASE_DAMPING_RATIO).toBeLessThan(1);
    }
    // Softer at speed: the rig trails more the harder you drive.
    expect(chaseStiffness(CRUISE_SPEED)).toBeLessThan(chaseStiffness(0));
  });
});

describe("wave slope", () => {
  // seaSlopeX/Z are hand-differentiated from seaHeight and carry the same KEEP
  // IN SYNC obligation as the shader. Compare against a numeric derivative so a
  // change to the wave field that misses them fails here instead of showing up
  // as a board tilting the wrong way.
  it("matches a numeric derivative of the wave field", () => {
    const h = 1e-4;
    for (const x of [-60, 0, 60, 137]) {
      for (const z of [-130, 0, 58]) {
        for (const time of [0, 2.3, 7.1]) {
          const dx = (seaHeight(x + h, z, time) - seaHeight(x - h, z, time)) / (2 * h);
          const dz = (seaHeight(x, z + h, time) - seaHeight(x, z - h, time)) / (2 * h);
          expect(seaSlopeX(x, z, time)).toBeCloseTo(dx, 6);
          expect(seaSlopeZ(x, z, time)).toBeCloseTo(dz, 6);
        }
      }
    }
  });
});
