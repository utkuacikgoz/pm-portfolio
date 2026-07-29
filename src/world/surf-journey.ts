import { WATER_Y, islandPosition, EMP_COUNT, INDIE_INDEX } from "./geometry";
import { T } from "../theme";

// The free-surf "journey": solid obstacles you can't pass through, a trail of
// coins to collect, and checkpoints that surface how Utku works. Positions are in
// the surf world (bounds x[-60,220], z[-130,130]) and are tunable.

interface Collider {
  x: number;
  z: number;
  r: number;
}

// Solid landmass footprints per break (approx world coords).
const BREAK_COLLIDERS: Collider[] = [
  { x: 145, z: -74, r: 8 }, // Nazare cliff
  { x: 112, z: 56, r: 5 }, // Pipeline sand cay
  { x: 49, z: 64, r: 4 }, // Teahupoo reef rock
  { x: -36, z: 25, r: 7 }, // Impossibles limestone
  { x: 0, z: -65, r: 7 }, // Bondi beach
];

// The career islands (BiLira tower ... Upshift) + the indie island sit right in
// the surf area, so they need colliders too — otherwise you wedge straight
// through the monuments.
function islandColliders(): Collider[] {
  const arr: Collider[] = [];
  for (let i = 0; i < EMP_COUNT; i++) {
    const [x, , z] = islandPosition(i);
    arr.push({ x, z, r: 6 });
  }
  const [ix, , iz] = islandPosition(INDIE_INDEX);
  arr.push({ x: ix, z: iz, r: 5.5 });
  return arr;
}

// The board resolves against all of these each frame → it bounces instead of
// ghosting through cliffs/reefs/beaches and the career monuments.
export const SURF_COLLIDERS: Collider[] = [...BREAK_COLLIDERS, ...islandColliders()];

interface Coin {
  id: number;
  x: number;
  z: number;
}

// A scenic loop through the breaks — coins are strewn along it so surfing the
// tour collects them.
const WAYPOINTS: [number, number][] = [
  [60, 0],
  [40, 58],
  [120, 48],
  [155, -72],
  [0, -58],
  [-25, 25],
  [60, 0],
];

function buildCoins(): Coin[] {
  const coins: Coin[] = [];
  let id = 0;
  for (let s = 0; s < WAYPOINTS.length - 1; s++) {
    const [ax, az] = WAYPOINTS[s];
    const [bx, bz] = WAYPOINTS[s + 1];
    const dist = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(dist / 9));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      if (SURF_COLLIDERS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 3)) continue;
      coins.push({ id: id++, x, z });
    }
  }
  return coins;
}

// 42 coins (the answer to everything), sampled EVENLY across the built trail so
// every leg of the loop carries some. A head slice (`.slice(0, 42)`) looked
// equivalent but starved the tail: the last waypoint segment ended up with zero
// coins, so the ride home paid nothing.
const COIN_GOAL = 42;
function spread(raw: Coin[]): Coin[] {
  if (raw.length <= COIN_GOAL) return raw;
  const out: Coin[] = [];
  for (let i = 0; i < COIN_GOAL; i++) {
    out.push(raw[Math.round((i * (raw.length - 1)) / (COIN_GOAL - 1))]);
  }
  return out;
}

export const COINS: Coin[] = spread(buildCoins());
export const COIN_TOTAL = COINS.length;
export const COIN_Y = WATER_Y + 1.4;

// Collected coins live here (module state) so the controller (collection) and the
// visuals (hide) share it without routing per-frame data through React. Module
// scope is deliberately the session: it survives leaving and re-entering surf
// mode (so the run cannot be farmed) and resets on page load.
export const collectedCoins = new Set<number>();

export interface Checkpoint {
  id: number;
  x: number;
  z: number;
  angle: number; // gate facing, radians — the tangent of the loop at this point
  title: string; // the principle
  text: string; // one supporting line (dash-free)
  accent: string;
}

// Where a fraction 0..1 along the coin loop lands, plus which way the loop is
// heading there. Gates were previously placed at hand-picked coordinates that sat
// off the trail with no rotation, so you met them side-on, out of order, and they
// read as random scenery. Sampling the same waypoint path the coins use puts them
// ON the route, in sequence, square to your direction of travel.
function pointOnLoop(fraction: number): { x: number; z: number; angle: number } {
  const segs = WAYPOINTS.slice(0, -1).map((_, s) => {
    const [ax, az] = WAYPOINTS[s];
    const [bx, bz] = WAYPOINTS[s + 1];
    return Math.hypot(bx - ax, bz - az);
  });
  const total = segs.reduce((a, b) => a + b, 0);
  let want = fraction * total;
  for (let s = 0; s < segs.length; s++) {
    if (want > segs[s] && s < segs.length - 1) {
      want -= segs[s];
      continue;
    }
    const [ax, az] = WAYPOINTS[s];
    const [bx, bz] = WAYPOINTS[s + 1];
    const t = Math.min(1, want / segs[s]);
    return {
      x: ax + (bx - ax) * t,
      z: az + (bz - az) * t,
      // Gate posts sit on the X axis before rotation, so face the gate along the
      // path tangent to surf straight through the opening.
      angle: Math.atan2(bx - ax, bz - az),
    };
  }
  return { x: WAYPOINTS[0][0], z: WAYPOINTS[0][1], angle: 0 };
}

// Four beats in narrative order, spaced along the loop so a single lap reads as a
// story rather than four unrelated signs.
const BEATS: { title: string; text: string; accent: string }[] = [
  {
    title: "Bias for action",
    text: "Automate the 90 percent that is obvious and spend your people on the 10 that is not.",
    accent: T.coral,
  },
  {
    title: "Lead with example",
    text: "When two experts disagree, both are usually partly right. Sit in the work and co-design instead of picking a side.",
    accent: T.peri,
  },
  {
    title: "Culture over strategy",
    text: "A strategy deck does not survive a rule change. A team that trusts each other does.",
    accent: T.green,
  },
  {
    title: "Winner takes it all",
    text: "Compliance framed as a growth enabler becomes a moat a competitor cannot copy.",
    accent: T.mauve,
  },
];

export const CHECKPOINTS: Checkpoint[] = BEATS.map((b, i) => {
  const p = pointOnLoop(0.14 + i * 0.24);
  return { id: i, x: p.x, z: p.z, angle: p.angle, ...b };
});
export const CHECKPOINT_TOTAL = CHECKPOINTS.length;
