// Breaks scattered across the free-surf ocean, so roaming becomes a little tour
// instead of an empty plane. Positions live inside the SurfController bounds
// (x[-60,220], z[-130,130]) and are spread in different directions from the
// spawn near the islands, close enough that you actually cross them while
// roaming (the reported "never reach a spot" problem).
//
// The breaks are deliberately UNNAMED to the visitor. They used to carry real
// surf-spot names and a line of trivia each, which read as an encyclopedia
// bolted onto a portfolio: content about surfing, telling a recruiter nothing
// about Utku, in a world where every other landmark is something he built. The
// waves are worth riding on their own. `id` survives only as an internal
// codename that maps a spot to its sculpted geometry in SurfSpots.tsx.
import { T } from "../theme";

export interface SurfSpot {
  id: string;
  pos: [number, number]; // [x, z] landmark origin (beacon anchor)
  take: [number, number]; // [x, z] the wave's takeoff point — where you catch it
  ride: { lift: number; direction: [number, number] };
  accent: string; // palette marker + beacon color
}

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "teahupoo",
    pos: [40, 58],
    take: [40, 58],
    ride: { lift: 1.7, direction: [80, -10] },
    accent: T.blue,
  },
  {
    id: "bondi",
    pos: [0, -58],
    take: [0, -55],
    ride: { lift: 0.9, direction: [-25, 83] },
    accent: T.seafoam,
  },
  {
    id: "impossibles",
    pos: [-25, 25],
    take: [-22, 27],
    ride: { lift: 1.8, direction: [85, -25] },
    accent: T.gold,
  },
  {
    id: "pipeline",
    pos: [120, 48],
    take: [122, 46],
    ride: { lift: 2.3, direction: [35, -120] },
    accent: T.coral,
  },
  {
    id: "nazare",
    pos: [155, -72],
    take: [162, -71],
    ride: { lift: 4.4, direction: [-155, 14] },
    accent: T.blue,
  },
];

// Open-water launch: the gentle beach break is ahead, but the player reaches it
// under their own control rather than surf mode beginning inside its catch zone.
export const SURF_LAUNCH = {
  position: [38, -12] as [number, number],
  heading: Math.atan2(-38, -43),
};

// Nearest break whose TAKEOFF is within `radius` of (x,z), or null. This is the
// catch test: surf into the takeoff zone and you drop in. Squared distance so we
// skip the per-call sqrt.
export function nearestTakeoff(x: number, z: number, radius: number): SurfSpot | null {
  let best: SurfSpot | null = null;
  let bestSq = radius * radius;
  for (const s of SURF_SPOTS) {
    const dx = x - s.take[0];
    const dz = z - s.take[1];
    const sq = dx * dx + dz * dz;
    if (sq < bestSq) {
      bestSq = sq;
      best = s;
    }
  }
  return best;
}
