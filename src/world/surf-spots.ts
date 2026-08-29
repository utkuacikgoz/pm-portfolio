// Breaks scattered across the free-surf ocean, so roaming becomes a little tour
// instead of an empty plane. Positions live inside the SurfController bounds
// (x[-60,220], z[-130,130]) and are spread in different directions from the
// spawn near the islands, close enough that you actually cross them while
// roaming (the reported "never reach a spot" problem).
//
// The breaks carry no surf trivia. They used to carry real surf-spot names and
// a line of history each, which read as an encyclopedia bolted onto a
// portfolio: content about surfing, telling a recruiter nothing about Utku, in
// a world where every other landmark is something he built. `id` survives only
// as an internal codename mapping a spot to its sculpted geometry in
// SurfSpots.tsx.
//
// What each break DOES carry is a project. The fun and the pitch used to be
// disjoint: the most memorable ninety seconds on the site said the least about
// the work. Now the wave you catch is one of the five products, the beacon and
// buoy burn in that project's accent, and riding it out surfaces its headline.
// The heaviest wave carries the strongest signal, so the registry's first row
// (BiLira) is the one you drop into at the biggest break.
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { T } from "../theme";
import { CURL } from "./wave-face";

export interface SurfSpot {
  id: string;
  pos: [number, number]; // [x, z] landmark origin (beacon anchor)
  take: [number, number]; // [x, z] the wave's takeoff point — where you catch it
  ride: { lift: number; direction: [number, number] };
  /**
   * Registry id of the project this break IS. Not decoration: it colors the
   * break and it is what the ride hands back when you kick out of the wave.
   */
  projectId: string;
  accent: string; // palette marker + beacon color, taken from that project
  /**
   * How hard this wave throws its lip. Only a break that curls past vertical
   * can cover a rider, so this is also what decides whether dropping in here
   * puts you in a barrel or just on a face. See `wave-face.ts`.
   */
  curl: number;
}

/**
 * Breaks in descending wave size, so the mapping below reads as an ordering
 * rather than five arbitrary pairs.
 */
const BREAKS_BY_WEIGHT = ["nazare", "pipeline", "impossibles", "teahupoo", "bondi"] as const;

/**
 * Which project each break carries, biggest wave to smallest, against the
 * registry's own order (strongest recruiter signal first). Derived rather than
 * hardcoded so the extensibility contract still holds: publishing a project
 * moves it into this list without touching a single coordinate. A sixth
 * published project simply has no break, which `surf-spots.test.ts` states
 * out loud so it is a known gap rather than a silent one.
 */
function projectForBreak(id: string): { projectId: string; accent: string } {
  const rank = BREAKS_BY_WEIGHT.indexOf(id as (typeof BREAKS_BY_WEIGHT)[number]);
  const project = rank >= 0 ? PUBLISHED_PROJECTS[rank] : undefined;
  // No project to carry (fewer published rows than breaks): the break keeps its
  // own identity rather than borrowing someone else's accent.
  return project
    ? { projectId: project.id, accent: project.accent }
    : { projectId: "", accent: T.seafoam };
}

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "teahupoo",
    pos: [40, 58],
    take: [40, 58],
    ride: { lift: 1.7, direction: [80, -10] },
    curl: CURL.slab,
    ...projectForBreak("teahupoo"),
  },
  {
    id: "bondi",
    pos: [0, -58],
    take: [0, -55],
    ride: { lift: 0.9, direction: [-25, 83] },
    curl: CURL.gentle,
    ...projectForBreak("bondi"),
  },
  {
    id: "impossibles",
    pos: [-25, 25],
    take: [-22, 27],
    ride: { lift: 1.8, direction: [85, -25] },
    curl: CURL.peeling,
    ...projectForBreak("impossibles"),
  },
  {
    id: "pipeline",
    pos: [120, 48],
    take: [122, 46],
    ride: { lift: 2.3, direction: [35, -120] },
    curl: CURL.slab,
    ...projectForBreak("pipeline"),
  },
  {
    id: "nazare",
    pos: [155, -72],
    take: [162, -71],
    ride: { lift: 4.4, direction: [-155, 14] },
    curl: CURL.slab,
    ...projectForBreak("nazare"),
  },
];

/** The break that carries a given project, or null if none does. */
export function spotForProject(projectId: string): SurfSpot | null {
  return SURF_SPOTS.find((s) => s.projectId === projectId) ?? null;
}

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
