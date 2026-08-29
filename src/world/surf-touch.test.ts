import { describe, it, expect, beforeEach } from "vitest";
import {
  BOOST_THRESHOLD,
  DOUBLE_TAP_WINDOW,
  PACE_DEADZONE,
  PACE_RADIUS,
  STEER_DEADZONE,
  STEER_RADIUS,
  TAP_MAX_DRAG,
  TAP_MAX_SECONDS,
  isBoostDrag,
  isDoubleTap,
  isTap,
  resetSurfTouch,
  steerFromDrag,
  surfTouch,
  throttleFromDrag,
} from "./surf-touch";

describe("steerFromDrag", () => {
  it("ignores a drag inside the deadzone", () => {
    expect(steerFromDrag(0)).toBe(0);
    expect(steerFromDrag(STEER_DEADZONE)).toBe(0);
    expect(steerFromDrag(-STEER_DEADZONE)).toBe(0);
  });

  // The sign is the whole reason this function exists: the frame loop's steering
  // input is `left - right`, so a rightward drag has to come back NEGATIVE.
  it("steers right for a rightward drag and left for a leftward one", () => {
    expect(steerFromDrag(40)).toBeLessThan(0);
    expect(steerFromDrag(-40)).toBeGreaterThan(0);
  });

  it("reaches full lock at the steering radius and clamps past it", () => {
    expect(steerFromDrag(STEER_DEADZONE + STEER_RADIUS)).toBeCloseTo(-1, 6);
    expect(steerFromDrag(900)).toBe(-1);
    expect(steerFromDrag(-900)).toBe(1);
  });

  it("rises continuously out of the deadzone rather than jumping", () => {
    const justPast = steerFromDrag(STEER_DEADZONE + 1);
    expect(Math.abs(justPast)).toBeGreaterThan(0);
    expect(Math.abs(justPast)).toBeLessThan(0.05);
  });
});

describe("throttleFromDrag", () => {
  // A thumb carving left and right also travels up and down. If that cost pace,
  // every turn would read as the board bogging down for no reason the visitor
  // can see, so ordinary steering slop must leave the throttle untouched.
  it("holds full cruise for no drag, an upward drag, and steering slop", () => {
    expect(throttleFromDrag(0)).toBe(1);
    expect(throttleFromDrag(-80)).toBe(1);
    expect(throttleFromDrag(PACE_DEADZONE)).toBe(1);
  });

  it("brakes smoothly down to a dead stop at the pace radius", () => {
    const half = throttleFromDrag(PACE_DEADZONE + PACE_RADIUS / 2);
    expect(half).toBeCloseTo(0.5, 6);
    expect(throttleFromDrag(PACE_DEADZONE + PACE_RADIUS)).toBeCloseTo(0, 6);
  });

  it("never goes negative, so a hard pull down stops rather than reverses", () => {
    expect(throttleFromDrag(2000)).toBe(0);
  });
});

describe("isBoostDrag", () => {
  it("engages only on a deliberate pull upward", () => {
    expect(isBoostDrag(-BOOST_THRESHOLD)).toBe(true);
    expect(isBoostDrag(-BOOST_THRESHOLD + 1)).toBe(false);
    expect(isBoostDrag(0)).toBe(false);
    expect(isBoostDrag(BOOST_THRESHOLD)).toBe(false);
  });
});

describe("tap detection", () => {
  it("accepts a short, still press", () => {
    expect(isTap(0, 0.1)).toBe(true);
    expect(isTap(TAP_MAX_DRAG, TAP_MAX_SECONDS)).toBe(true);
  });

  it("rejects a press that travelled or was held", () => {
    expect(isTap(TAP_MAX_DRAG + 1, 0.1)).toBe(false);
    expect(isTap(2, TAP_MAX_SECONDS + 0.01)).toBe(false);
  });

  it("pairs two taps inside the window and no further", () => {
    expect(isDoubleTap(0.3, 0.1)).toBe(true);
    expect(isDoubleTap(DOUBLE_TAP_WINDOW, 0)).toBe(true);
    expect(isDoubleTap(DOUBLE_TAP_WINDOW + 0.05, 0)).toBe(false);
    // A first tap has no predecessor; -Infinity must not read as a double.
    expect(isDoubleTap(1, -Infinity)).toBe(false);
  });
});

describe("surfTouch channel", () => {
  beforeEach(resetSurfTouch);

  // Resting throttle is 1, not 0. On a phone the board keeps its pace whenever
  // the thumb is off the glass; a reset to zero would stop the run dead every
  // time a press ended.
  it("rests at hands-off cruise", () => {
    surfTouch.steer = -0.8;
    surfTouch.throttle = 0.1;
    surfTouch.boost = true;
    surfTouch.jump = true;
    surfTouch.spin = true;
    resetSurfTouch();
    expect(surfTouch.steer).toBe(0);
    expect(surfTouch.throttle).toBe(1);
    expect(surfTouch.boost).toBe(false);
    expect(surfTouch.jump).toBe(false);
    expect(surfTouch.spin).toBe(false);
  });

  it("leaves `enabled` alone, since that tracks the pad's lifetime", () => {
    surfTouch.enabled = true;
    resetSurfTouch();
    expect(surfTouch.enabled).toBe(true);
    surfTouch.enabled = false;
  });
});
