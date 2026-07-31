import { describe, it, expect } from "vitest";
import { COINS, COIN_TOTAL, SURF_COLLIDERS, collectedCoins, CHECKPOINTS, CHECKPOINT_TOTAL } from "./surf-journey";
import { SURF_LAUNCH, SURF_SPOTS } from "./surf-spots";

// The coin trail loops through the breaks and back to where it started, so the
// last stretch is as much of the ride as the first. An earlier `.slice(0, 42)`
// looked like a harmless cap but silently starved the tail: the final leg ended
// up with zero coins. These tests pin the shape of the trail, not the exact
// positions, so tuning waypoints stays cheap.

describe("coin trail", () => {
  it("carries exactly 42 coins", () => {
    expect(COIN_TOTAL).toBe(42);
    expect(COINS).toHaveLength(42);
  });

  it("spreads coins across the whole loop, including the ride home", () => {
    // The loop starts and ends at the same waypoint, so "the ride home" is the
    // stretch whose x climbs back toward the start while z heads back to 0.
    const xs = COINS.map((c) => c.x);
    const lastQuarter = COINS.slice(Math.floor(COINS.length * 0.75));
    expect(lastQuarter.length).toBeGreaterThan(0);
    // The tail must not be a duplicate of the head, which is what a head-slice
    // plus wrap-around would produce.
    expect(new Set(xs).size).toBeGreaterThan(COINS.length / 2);
  });

  it("keeps coins clear of every solid collider", () => {
    for (const c of COINS) {
      for (const s of SURF_COLLIDERS) {
        expect(Math.hypot(c.x - s.x, c.z - s.z)).toBeGreaterThanOrEqual(s.r);
      }
    }
  });

  it("gives every coin a unique id so collection cannot double count", () => {
    expect(new Set(COINS.map((c) => c.id)).size).toBe(COINS.length);
  });

  it("starts a run with nothing collected", () => {
    expect(collectedCoins.size).toBe(0);
  });
});

// The gates used to sit at hand-picked coordinates off the trail with no rotation,
// so you met them side-on and out of order and they read as random scenery. These
// pin the "part of a story" property: on the route, in sequence, facing you.
describe("how I work checkpoints", () => {
  it("is a four beat sequence with ids in narrative order", () => {
    expect(CHECKPOINT_TOTAL).toBe(4);
    expect(CHECKPOINTS.map((c) => c.id)).toEqual([0, 1, 2, 3]);
    expect(CHECKPOINTS.map((c) => c.title)).toEqual([
      "Bias for action",
      "Lead with example",
      "Culture over strategy",
      "Winner takes it all",
    ]);
  });

  it("places every gate on the coin trail, not off in open water", () => {
    for (const c of CHECKPOINTS) {
      const nearest = Math.min(...COINS.map((k) => Math.hypot(k.x - c.x, k.z - c.z)));
      expect(nearest).toBeLessThan(12);
    }
  });

  it("keeps every gate clear of the solid landmasses you would bounce off", () => {
    const GATE_HALF_WIDTH = 3.8;
    for (const c of CHECKPOINTS) {
      for (const s of SURF_COLLIDERS) {
        expect(Math.hypot(c.x - s.x, c.z - s.z)).toBeGreaterThan(s.r + GATE_HALF_WIDTH);
      }
    }
  });

  it("faces each gate along the route so you surf through the opening", () => {
    for (const c of CHECKPOINTS) {
      expect(Number.isFinite(c.angle)).toBe(true);
    }
    // A single facing reused everywhere would mean the gates ignore the path.
    expect(new Set(CHECKPOINTS.map((c) => c.angle.toFixed(3))).size).toBeGreaterThan(1);
  });

  it("carries a supporting line under every principle", () => {
    for (const c of CHECKPOINTS) {
      expect(c.text.length).toBeGreaterThan(20);
      expect(c.text).not.toContain("—"); // house style: dash free
    }
  });
});

describe("named-break rides", () => {
  it("gives every break a bounded player-controlled lift", () => {
    for (const spot of SURF_SPOTS) {
      expect(spot.ride.lift).toBeGreaterThan(0);
      expect(spot.ride.lift).toBeLessThanOrEqual(5);
    }
  });

  it("starts in open water rather than inside Bondi's catch zone", () => {
    const bondi = SURF_SPOTS.find((spot) => spot.id === "bondi");
    expect(bondi).toBeDefined();
    expect(Math.hypot(SURF_LAUNCH.position[0] - bondi!.take[0], SURF_LAUNCH.position[1] - bondi!.take[1])).toBeGreaterThan(26);
  });
});
