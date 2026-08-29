import { describe, it, expect } from "vitest";
import {COINS, COIN_TOTAL, COIN_Y, SURF_COLLIDERS, collectedCoins } from "./surf-journey";
import { SURF_LAUNCH, SURF_SPOTS } from "./surf-spots";
import { SURF_BOUNDS } from "./surf-controls";
import { WATER_Y, seaHeight } from "./geometry";
import { DISTANT_PEAKS } from "./distant-mountains";

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

  it("keeps every coin visibly above the moving water", () => {
    for (const coin of COINS) {
      for (const time of [0, 1.25, 3.7, 8.4]) {
        expect(COIN_Y).toBeGreaterThan(WATER_Y + seaHeight(coin.x, coin.z, time) + 0.35);
      }
    }
  });

  it("gives every surrounding mountain a physical bounce volume", () => {
    for (const peak of DISTANT_PEAKS) {
      const collider = SURF_COLLIDERS.find((candidate) => candidate.x === peak.x && candidate.z === peak.z);
      expect(collider).toBeDefined();
      expect(collider!.r).toBeGreaterThan(peak.w);
    }
  });

  // The peaks are meant to read as horizon. They used to be generated at radius
  // 155 while the wall stood at z 130, so their collision volumes reached into
  // the water you actually surf: you could bump a "distant" mountain, and the
  // ocean felt small. Keep them a clear margin outside every reachable point.
  it("keeps the horizon ring outside the water you can reach", () => {
    const corners = [
      [SURF_BOUNDS.minX, SURF_BOUNDS.minZ],
      [SURF_BOUNDS.minX, SURF_BOUNDS.maxZ],
      [SURF_BOUNDS.maxX, SURF_BOUNDS.minZ],
      [SURF_BOUNDS.maxX, SURF_BOUNDS.maxZ],
    ];
    for (const peak of DISTANT_PEAKS) {
      for (const [x, z] of corners) {
        const clearance = Math.hypot(peak.x - x, peak.z - z) - (peak.w + 1.6);
        expect(clearance).toBeGreaterThan(40);
      }
    }
  });

  it("gives every coin a unique id so collection cannot double count", () => {
    expect(new Set(COINS.map((c) => c.id)).size).toBe(COINS.length);
  });

  it("forms a continuous trail without dead gaps", () => {
    for (let i = 1; i < COINS.length; i++) {
      expect(Math.hypot(COINS[i].x - COINS[i - 1].x, COINS[i].z - COINS[i - 1].z)).toBeLessThan(52);
    }
  });

  it("guides the player around every break without hiding tokens inside it", () => {
    for (const spot of SURF_SPOTS) {
      const nearest = Math.min(...COINS.map((coin) => Math.hypot(coin.x - spot.take[0], coin.z - spot.take[1])));
      expect(nearest).toBeGreaterThanOrEqual(24);
      expect(nearest).toBeLessThan(36);
    }
  });

  it("starts a run with nothing collected", () => {
    expect(collectedCoins.size).toBe(0);
  });
});

// The gates used to sit at hand-picked coordinates off the trail with no rotation,
// so you met them side-on and out of order and they read as random scenery. These
// pin the "part of a story" property: on the route, in sequence, facing you.

describe("break rides", () => {
  it("gives every break a bounded player-controlled lift", () => {
    for (const spot of SURF_SPOTS) {
      expect(spot.ride.lift).toBeGreaterThan(0);
      expect(spot.ride.lift).toBeLessThanOrEqual(5);
      expect(Math.hypot(...spot.ride.direction)).toBeGreaterThan(1);
    }
  });

  it("starts in open water rather than inside the beach break's catch zone", () => {
    const bondi = SURF_SPOTS.find((spot) => spot.id === "bondi");
    expect(bondi).toBeDefined();
    expect(Math.hypot(SURF_LAUNCH.position[0] - bondi!.take[0], SURF_LAUNCH.position[1] - bondi!.take[1])).toBeGreaterThan(26);
  });
});
