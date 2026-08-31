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
  carveRatio,
  carveWakeScale,
  carveWakeDuration,
  cameraFov,
  cameraBank,
  aspectFov,
  MAX_FOV,
  PORTRAIT_ASPECT,
  MAX_FOV_GAIN,
  REFERENCE_ASPECT,
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

  // This assertion used to be the opposite: the ratio was deliberately under
  // critical, for "barely enough overshoot to breathe". That overshoot lands as
  // a small recoil at the end of every turn, and a surf run is mostly turns, so
  // the intent changed rather than the number drifting. Breathing is the swell
  // bob and the lens; the chase rig's job is to settle and stay out of the way.
  it("is at least critically damped, so the camera never recoils after a turn", () => {
    for (const speed of SPEEDS) {
      const k = chaseStiffness(speed);
      expect(chaseDamping(k)).toBeCloseTo(2 * CHASE_DAMPING_RATIO * Math.sqrt(k));
    }
    expect(CHASE_DAMPING_RATIO).toBeGreaterThanOrEqual(1);
    // Softer at speed: the rig trails more the harder you drive.
    expect(chaseStiffness(CRUISE_SPEED)).toBeLessThan(chaseStiffness(0));
  });

  // The complaint that produced this pass was "too aggressive and responsive".
  // Each of these is one of the levers that made it so, pinned at an upper
  // bound rather than an exact value so they stay tunable without going back
  // to where they were.
  it("keeps the camera calm enough to see past", () => {
    // A spring stiff enough to track the board reproduces every correction the
    // rider makes, which is the input they are trying to see past.
    expect(chaseStiffness(0)).toBeLessThanOrEqual(40);
    // Roll reads as bank up to a point and as the horizon tipping past it.
    expect(Math.abs(cameraBank(0.46, CRUISE_SPEED))).toBeLessThanOrEqual(0.05);
    // The lens should breathe with pace, not pump.
    expect(cameraFov(CRUISE_SPEED, 0) - cameraFov(0, 0)).toBeLessThanOrEqual(7);
  });

  it("still sells pace, having been calmed down", () => {
    // Calmer must not mean inert: every cue that carried speed still moves the
    // same direction, just less far.
    expect(cameraFov(CRUISE_SPEED, 0)).toBeGreaterThan(cameraFov(0, 0));
    expect(cameraDistance(CRUISE_SPEED, false)).toBeGreaterThan(cameraDistance(0, false));
    expect(cameraHeight(CRUISE_SPEED, false)).toBeLessThan(cameraHeight(0, false));
    expect(Math.abs(cameraBank(0.46, CRUISE_SPEED))).toBeGreaterThan(0);
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

/** Horizontal field of view (degrees) a vertical FOV gives at a window shape. */
function horizontalFov(fov: number, aspect: number): number {
  const deg = Math.PI / 180;
  return (2 * Math.atan(Math.tan((fov / 2) * deg) * aspect)) / deg;
}

describe("aspect-corrected lens", () => {
  const PORTRAIT = 390 / 844; // an iPhone held upright
  const LANDSCAPE = 16 / 9;

  // Not just 16:9: the curves were tuned by eye on a landscape screen, so every
  // landscape shape has to come back byte-identical. This is a fix for a shape
  // they were never tuned against, not a re-tune of the ones they were.
  it("leaves every landscape window exactly as it was tuned", () => {
    for (const speed of SPEEDS) {
      const fov = cameraFov(speed, 0);
      for (const aspect of [1, 1.33, 1.6, LANDSCAPE, 2.4]) {
        expect(aspectFov(fov, aspect)).toBe(fov);
      }
    }
  });

  // Dragging a desktop window through square must not snap the lens open.
  it("fades the correction in rather than stepping at square", () => {
    const fov = cameraFov(0, 0);
    const full = aspectFov(fov, PORTRAIT_ASPECT);
    const half = aspectFov(fov, 1 - (1 - PORTRAIT_ASPECT) / 2);
    // A hair past square is a hair of correction, not a step change.
    expect(aspectFov(fov, 0.999)).toBeGreaterThan(fov);
    expect(aspectFov(fov, 0.999)).toBeLessThan(fov + 0.25);
    expect(half).toBeGreaterThan(fov);
    expect(half).toBeLessThan(full);
    expect(aspectFov(fov, 0.4)).toBeCloseTo(full, 6); // saturated past the knee
  });

  // The reason the correction exists: three's fov is VERTICAL, so portrait crops
  // the sides. Uncorrected, the surf lens sees a telephoto slit sideways.
  it("widens a portrait lens well past the uncorrected slit", () => {
    const fov = cameraFov(0, 0);
    const uncorrected = horizontalFov(fov, PORTRAIT);
    const corrected = horizontalFov(aspectFov(fov, PORTRAIT), PORTRAIT);
    expect(uncorrected).toBeLessThan(25);
    expect(corrected).toBeGreaterThan(uncorrected * 1.4);
  });

  // Holding the landscape horizontal FOV at portrait aspect would need about
  // 117 degrees vertically. Both caps exist to stop well short of that.
  it("never opens into a fisheye, at any speed or any aspect", () => {
    for (const speed of SPEEDS) {
      for (const aspect of [PORTRAIT, 0.5, 0.75, 1, 1.3, LANDSCAPE]) {
        const fov = cameraFov(speed, 3);
        const out = aspectFov(fov, aspect);
        expect(out).toBeLessThanOrEqual(Math.max(fov, MAX_FOV));
        expect(out).toBeLessThanOrEqual(fov * MAX_FOV_GAIN + 1e-9);
        expect(out).toBeGreaterThanOrEqual(fov);
      }
    }
  });

  // The gain cap rather than the absolute cap has to be the binding one at the
  // slow end, or every speed lands on the same clamped value and the
  // widen-with-pace cue that sells speed disappears on phones.
  it("keeps the lens widening with pace in portrait", () => {
    const slow = aspectFov(cameraFov(0, 0), PORTRAIT);
    const fast = aspectFov(cameraFov(CRUISE_SPEED, 0), PORTRAIT);
    expect(fast).toBeGreaterThan(slow);
  });

  it("never corrects a degenerate aspect into a NaN", () => {
    const fov = cameraFov(10, 0);
    expect(aspectFov(fov, 0)).toBe(fov);
    expect(aspectFov(fov, Number.NaN)).toBe(fov);
    expect(aspectFov(fov, -1)).toBe(fov);
  });

  it("agrees with the reference aspect at the boundary", () => {
    const fov = cameraFov(12, 0);
    expect(aspectFov(fov, REFERENCE_ASPECT)).toBe(fov);
  });
});

describe("carve, written on the water", () => {
  it("reads zero running straight and one at full lock", () => {
    expect(carveRatio(1.2, 1.2)).toBe(0);
    expect(carveRatio(1.2, 1.2 - MAX_SLIP)).toBeCloseTo(1, 6);
    expect(carveRatio(1.2, 1.2 + MAX_SLIP)).toBeCloseTo(1, 6);
  });

  // `clampSlip` holds the nose inside MAX_SLIP, so the ratio is already bounded;
  // it must still not exceed 1 if it is ever handed a raw pair.
  it("stays inside 0..1 across the wrap", () => {
    for (const heading of [-3.1, -1, 0, 1, 3.1]) {
      for (const course of [-3.1, -1, 0, 1, 3.1]) {
        const r = carveRatio(heading, course);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(1);
      }
    }
  });

  it("takes the short way round the wrap, not the long one", () => {
    // Just either side of PI: a hair apart in reality, nearly a full turn if the
    // difference is taken without wrapping.
    expect(carveRatio(Math.PI - 0.01, -Math.PI + 0.01)).toBeCloseTo(0.02 / MAX_SLIP, 5);
  });

  it("leaves a straight-line wake exactly as it was", () => {
    expect(carveWakeScale(1.3, 0)).toBe(1.3);
    expect(carveWakeDuration(2.4, 0)).toBe(2.4);
  });

  it("widens the patch and holds it longer the harder you carve", () => {
    expect(carveWakeScale(1.3, 1)).toBeGreaterThan(carveWakeScale(1.3, 0.5));
    expect(carveWakeScale(1.3, 0.5)).toBeGreaterThan(carveWakeScale(1.3, 0));
    expect(carveWakeDuration(2.4, 1)).toBeGreaterThan(carveWakeDuration(2.4, 0.5));
    expect(carveWakeDuration(2.4, 0.5)).toBeGreaterThan(carveWakeDuration(2.4, 0));
  });

  // A foam patch is pooled: it has to die before its slot comes round again, or
  // a fresh patch pops in on top of an old one that never faded.
  it("never holds a patch longer than the pool can afford", () => {
    expect(carveWakeDuration(2.4, 1)).toBeLessThan(2.4 * 2);
  });
});
