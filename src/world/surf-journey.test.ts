import { describe, it, expect } from "vitest";
import { COINS, COIN_TOTAL, SURF_COLLIDERS, collectedCoins } from "./surf-journey";

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
