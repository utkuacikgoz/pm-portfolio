import { WATER_Y, islandPosition, EMP_COUNT, INDIE_INDEX } from "./geometry";
import { SURF_SPOTS } from "./surf-spots";
import { DISTANT_PEAKS } from "./distant-mountains";

// The free-surf "journey": solid obstacles you can't pass through and a trail of
// coins to collect. Positions are in the surf world (bounds x[-60,220],
// z[-130,130]) and are tunable.
//
// There were also four "product principle" gates here. They are gone. Two of
// the four titles were borrowed ("Bias for action" is one of Amazon's
// leadership principles verbatim), all four asserted things the rest of the
// site proves with numbers, and stopping a kinetic surf run to read a maxim is
// too short to be substance and too long to ignore. They existed to say
// something about Utku while surfing, and every break carrying a real project
// with a real metric now does that job properly.

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
const MOUNTAIN_COLLIDERS: Collider[] = DISTANT_PEAKS.map((peak) => ({
  x: peak.x,
  z: peak.z,
  r: peak.w + 1.6,
}));

export const SURF_COLLIDERS: Collider[] = [...BREAK_COLLIDERS, ...islandColliders(), ...MOUNTAIN_COLLIDERS];

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
    // Start dense, then spread down to the final 42. Extra samples let us cut a
    // generous clean-water pocket around every break without starving the run.
    const n = Math.max(2, Math.round(dist / 5));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      if (SURF_COLLIDERS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + 3)) continue;
      // Never hide a collectible inside a landmark or wave face. The route goes
      // around each break, while the takeoff itself stays visually clean.
      if (SURF_SPOTS.some((spot) =>
        Math.hypot(x - spot.pos[0], z - spot.pos[1]) < 24 ||
        Math.hypot(x - spot.take[0], z - spot.take[1]) < 24
      )) continue;
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
// The ocean shader can crest roughly 1.3 units above its base. Keep the coin
// disc comfortably clear of that peak so it never appears half-submerged.
export const COIN_Y = WATER_Y + 2.1;

// Collected coins live here (module state) so the controller (collection) and the
// visuals (hide) share it without routing per-frame data through React. Module
// scope is deliberately the session: it survives leaving and re-entering surf
// mode (so the run cannot be farmed) and resets on page load.
export const collectedCoins = new Set<number>();
