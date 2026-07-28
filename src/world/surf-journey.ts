import { WATER_Y } from "./geometry";
import { T } from "../theme";

// The free-surf "journey": solid obstacles you can't pass through, a trail of
// coins to collect, and checkpoints that surface how Utku works. Positions are in
// the surf world (bounds x[-60,220], z[-130,130]) and are tunable.

export interface Collider {
  x: number;
  z: number;
  r: number;
}

// Solid landmass footprints per break (approx world coords). The board resolves
// against these each frame so you stop clipping through cliffs/reefs/beaches.
export const SURF_COLLIDERS: Collider[] = [
  { x: 145, z: -74, r: 8 }, // Nazare cliff
  { x: 112, z: 56, r: 5 }, // Pipeline sand cay
  { x: 49, z: 64, r: 4 }, // Teahupoo reef rock
  { x: -36, z: 25, r: 7 }, // Impossibles limestone
  { x: 0, z: -65, r: 7 }, // Bondi beach
];

export interface Coin {
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

export const COINS: Coin[] = buildCoins();
export const COIN_TOTAL = COINS.length;
export const COIN_Y = WATER_Y + 1.4;

// Collected coins live here (module state) so the controller (collection) and the
// visuals (hide) share it without routing per-frame data through React.
export const collectedCoins = new Set<number>();
export function resetJourney() {
  collectedCoins.clear();
}

export interface Checkpoint {
  id: number;
  x: number;
  z: number;
  text: string; // one line on how Utku works (dash-free)
  accent: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  { id: 0, x: 50, z: 28, text: "Automate the 90 percent that is obvious, and spend your people on the 10 that is not.", accent: T.coral },
  { id: 1, x: 132, z: 8, text: "In a regulated market, design for the regulator first, then speed is yours to keep.", accent: T.peri },
  { id: 2, x: 78, z: -62, text: "When two experts disagree, both are usually partly right. Co-design instead of picking a side.", accent: T.green },
  { id: 3, x: -18, z: -20, text: "Ship modular, not monolithic. When the rules move, you change one piece, not the whole engine.", accent: T.mauve },
  { id: 4, x: 14, z: 42, text: "Compliance framed as a growth enabler becomes a moat a competitor cannot copy.", accent: T.sand },
];
