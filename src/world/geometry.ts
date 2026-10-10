import type { Project, StructureType } from "../projects/projects";
import { T } from "../theme";
import { EMP_COUNT, INDIE_INDEX, WATER_Y } from "./layout";

// Re-exported so every world module can keep importing them from here, while
// the DOM shell imports them from `layout` and leaves the builders below out of
// the entry chunk.
export { EMP_COUNT, INDIE_INDEX, WATER_Y };

// Distance between island centers along the rail (X axis). Roomier than a tight
// diorama so the world reads as a place you travel through.
export const SPACING = 22;

export const WATER_GAP = 46; // ocean you surf across to reach the indie island

// Wave height (world Y offset above WATER_Y) at a world (x,z) — mirrors the Water
// vertex shader's waveH (in Ocean.tsx) so things (the surfboard) ride the moving
// surface instead of clipping under it. KEEP IN SYNC with that GLSL. The water
// plane is centered at x=60 and rotated -90deg about X (plane-local y maps to
// -worldZ), hence the offsets.
export function seaHeight(wx: number, wz: number, t: number): number {
  const px = wx - 60;
  const py = -wz;
  return (
    Math.sin(px * 0.06 + t * 0.8) * 0.6 +
    Math.sin(py * 0.09 - t * 0.6) * 0.4 +
    Math.sin((px + py) * 0.05 + t * 0.5) * 0.3
  );
}

// Exact partial derivatives of seaHeight, in WORLD axes: the slope of the face
// the board is sitting on, so it can pitch and roll to the swell instead of
// only riding its height. This is the same gradient the Water shader already
// carries as `waveGrad` (which works in plane-local coords), differentiated by
// hand rather than sampled — so it is ALSO covered by the KEEP IN SYNC rule
// above: change waveH and all three of these move together.
//
// Amplitudes fall out of the chain rule: 0.6*0.06 = 0.036, 0.4*0.09 = 0.036,
// 0.3*0.05 = 0.015.
export function seaSlopeX(wx: number, wz: number, t: number): number {
  const px = wx - 60;
  const py = -wz;
  return Math.cos(px * 0.06 + t * 0.8) * 0.036 + Math.cos((px + py) * 0.05 + t * 0.5) * 0.015;
}

export function seaSlopeZ(wx: number, wz: number, t: number): number {
  const px = wx - 60;
  const py = -wz;
  // py = -wz, so the chain rule flips the sign of every py-bearing term.
  return -(Math.cos(py * 0.09 - t * 0.6) * 0.036 + Math.cos((px + py) * 0.05 + t * 0.5) * 0.015);
}

interface Cube {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

// ── tiny hex helpers (no deps) ───────────────────────────────────────────────
function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function toHex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}
function mix(a: string, b: string, t: number): string {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return toHex([
    ra[0] + (rb[0] - ra[0]) * t,
    ra[1] + (rb[1] - ra[1]) * t,
    ra[2] + (rb[2] - ra[2]) * t,
  ]);
}

// Deterministic pseudo-random so terrain looks organic but is stable per render.
export function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const TERRAIN_DARK = "#2B2422";
const TERRAIN_MID = "#473C39";

// X position per island index. Employment islands are evenly spaced; the indie
// island sits past a wide water gap (you surf across it).
export function islandX(i: number): number {
  return i < EMP_COUNT ? i * SPACING : (EMP_COUNT - 1) * SPACING + WATER_GAP;
}
// Islands weave gently along Z so the rail isn't a dead-straight line.
export function islandBaseZ(i: number): number {
  return i < EMP_COUNT ? Math.sin(i * 0.9) * 2.4 : 0;
}
export function islandPosition(i: number): [number, number, number] {
  return [islandX(i), 0, islandBaseZ(i)];
}

// All builders below produce cubes relative to an island's origin (0,0,0);
// buildWorld() translates them into place. Keeps layout math in one spot.

function buildTerrain(accent: string, seed: number): Cube[] {
  const cubes: Cube[] = [];
  const rand = rng(seed);
  const layers = [
    { y: 0, r: 4.2, color: mix(TERRAIN_MID, accent, 0.22) }, // top, accent-tinted rim
    { y: -1, r: 3.6, color: TERRAIN_MID },
    { y: -2, r: 2.6, color: TERRAIN_DARK },
    { y: -3, r: 1.4, color: TERRAIN_DARK },
  ];
  for (const layer of layers) {
    const ri = Math.ceil(layer.r);
    for (let dx = -ri; dx <= ri; dx++) {
      for (let dz = -ri; dz <= ri; dz++) {
        if (dx * dx + dz * dz > layer.r * layer.r) continue;
        const jitter = layer.y === 0 && rand() > 0.82 ? 0.18 : 0;
        cubes.push({
          position: [dx, layer.y + jitter / 2, dz],
          scale: [1, 1 + jitter, 1],
          color: layer.color,
        });
      }
    }
  }
  return cubes;
}

// A glowing "stepping-stone" path linking consecutive islands → journey feel.
function buildPath(i: number): Cube[] {
  const [ax, , az] = islandPosition(i);
  const [bx, , bz] = islandPosition(i + 1);
  const cubes: Cube[] = [];
  // Scale step count with the gap so stepping-stone density stays constant as
  // SPACING grows (~one stone every 2 units).
  const dist = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(6, Math.round(dist / 2));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    cubes.push({
      position: [ax + (bx - ax) * t, -0.6, az + (bz - az) * t],
      scale: [0.7, 0.25, 0.7],
      color: "#7265A6",
    });
  }
  return cubes;
}

function block(
  x: number,
  y: number,
  z: number,
  color: string,
  scale: [number, number, number] = [1, 1, 1]
): Cube {
  return { position: [x, y + scale[1] / 2 - 0.5, z], scale, color };
}

function buildStructure(type: StructureType, accent: string): Cube[] {
  const bright = mix(accent, "#ffffff", 0.4);
  const deep = mix(accent, "#000000", 0.35);
  const out: Cube[] = [];
  switch (type) {
    case "tower": {
      // exchange / vault — a tapering stack with a glowing cap
      const h = 8;
      for (let y = 1; y <= h; y++) {
        const s = y < h - 2 ? 2 : 1;
        out.push(block(0, y, 0, y >= h - 1 ? bright : y % 2 ? accent : deep, [s, 1, s]));
      }
      out.push(block(2, 1, 1, deep), block(-2, 1, -1, deep), block(0, h + 1, 0, bright, [0.4, 0.6, 0.4]));
      break;
    }
    case "market": {
      // Stalls alone topped out at 2.5 against a 8.4-wide island, so this read
      // as a plate with cubes on it and the emblem looked unmoored. The sign
      // mast gives the storefront a silhouette you can pick out from the rail.
      const spots: [number, number][] = [
        [-2.2, -1],
        [1.4, -2.2],
        [2.2, 1.2],
        [-1, 2.2],
      ];
      spots.forEach(([x, z], i) => {
        out.push(block(x, 1, z, i % 2 ? accent : deep, [2, 1, 2]));
        out.push(block(x, 2, z, bright)); // peaked cap
      });
      out.push(block(0, 1, 0, deep, [0.6, 5, 0.6])); // sign mast
      out.push(block(0, 5.2, 0, bright, [2.6, 1.2, 0.5])); // hanging board
      out.push(block(0, 6.2, 0, accent, [0.5, 0.5, 0.5])); // finial
      break;
    }
    case "campus": {
      // Same problem as market: two low pavilions and nothing above them. The
      // central block plus its beacon give the campus a centre to read.
      out.push(block(-2, 1, 0, accent, [2, 1, 3]));
      out.push(block(1.5, 1, 0, deep, [2, 1, 4]));
      out.push(block(-0.2, 1, 0, bright, [1, 1, 1])); // connector
      out.push(block(-2, 2, 0, bright));
      out.push(block(1.5, 2, 1, bright));
      out.push(block(1.5, 2, -1, accent));
      out.push(block(-0.2, 1, 0, accent, [1.8, 5, 1.8])); // main block
      out.push(block(-0.2, 5.8, 0, bright, [0.6, 1.4, 0.6])); // beacon
      out.push(block(-0.2, 6.1, 0, bright, [1.6, 0.5, 0.5])); // cross arm
      break;
    }
    case "arcade": {
      out.push(block(0, 1, 0, accent, [2, 3, 2]));
      out.push(block(0, 4, 0, bright, [1, 1, 1]));
      out.push(block(0, 5, 0, bright, [0.4, 0.6, 0.4]));
      const ring: [number, number][] = [
        [-2.5, -2.5],
        [2.5, -2.5],
        [2.5, 2.5],
        [-2.5, 2.5],
      ];
      ring.forEach(([x, z], i) => out.push(block(x, 1, z, i % 2 ? accent : deep, [1, 2, 1])));
      break;
    }
    case "bridge": {
      // Taller pylons carrying a raised deck: a two-sided span reads as a span
      // when it is above the ground, not resting on it.
      out.push(block(-2.6, 1, 0, accent, [2, 4, 2]));
      out.push(block(2.6, 1, 0, deep, [2, 4, 2]));
      for (let x = -1.5; x <= 1.5; x++) out.push(block(x, 4, 0, bright));
      out.push(block(-2.6, 5, 0, bright, [0.5, 0.8, 0.5]));
      out.push(block(2.6, 5, 0, bright, [0.5, 0.8, 0.5]));
      break;
    }
    case "beacon":
    default: {
      out.push(block(0, 1, 0, accent, [1, 4, 1]));
      out.push(block(0, 5, 0, bright, [0.5, 0.7, 0.5]));
      break;
    }
  }
  return out;
}

/** Highest point of a structure archetype, in island-local Y. */
export function structureTop(type: StructureType): number {
  return buildStructure(type, "#888888").reduce(
    (top, c) => Math.max(top, c.position[1] + c.scale[1] / 2),
    0
  );
}

/**
 * How high each domain emblem floats above its island.
 *
 * Lives here rather than in Emblems.tsx so it can be tested against the actual
 * structure heights. It used to drift out of sync in both directions: the
 * emblem sat at 6.1 over structures only 2.5 tall (an icon adrift over a flat
 * plate), while the 9.1 tower punched straight through its own emblem at 8.5.
 */
/**
 * Islands drawn by hand (ProductHarbor, MarketplaceIslands) instead of the
 * procedural structures, and the tallest thing any of them draws, in world
 * units (the harbour's floating crystal, about 3.6). Emblem clearance is tested
 * against what is rendered, not against a procedural spire nobody sees.
 */
export const ILLUSTRATED_IDS = ["bilira", "mestores", "upshift", "apollo", "la3eb"] as const;
export const ILLUSTRATED_TOP = 5;

export const EMBLEM_HOVER: Record<StructureType, number> = {
  tower: 8.0,
  market: 8.0,
  campus: 8.4,
  arcade: 6.8,
  bridge: 7.2,
  beacon: 6.8,
};

// Radius of the ring the indie pylons stand on, and where the first one starts.
// Inside the 4.2 terrain disc and the 5.5 surf collider (surf-journey.ts). At
// 2.5 two of the three lined up along the rail camera's sight line and the
// third was occluded; 3.4 with the ring rotated spreads them across the frame.
const INDIE_RING = 3.4;
const INDIE_RING_START = -Math.PI / 6;

/** Where indie pylon `i` of `n` stands on its island, in island-local voxels. */
export function indiePylon(i: number, n: number): { x: number; z: number; height: number } {
  const angle = INDIE_RING_START + (i * 2 * Math.PI) / n;
  // Snapped to the voxel grid so the pylons sit on the terrain, not between it.
  return { x: Math.round(Math.cos(angle) * INDIE_RING), z: Math.round(Math.sin(angle) * INDIE_RING), height: 4 + (i % 3) };
}

/** World position of the top of indie pylon `i` of `n` (its light or capstone). */
export function indiePylonTop(i: number, n: number): [number, number, number] {
  const [ox, , oz] = islandPosition(INDIE_INDEX);
  const { x, z, height } = indiePylon(i, n);
  return [ox + x, height + 1, oz + z];
}

/**
 * The indie island, out past the water gap, built from the registry like every
 * other island: one pylon per indie product, in that product's own accent.
 *
 * A pylon says whether its product shipped. A live product (one with a `url`)
 * is a finished stack with a capstone; a bet in development is still
 * scaffolding, missing a course, with a signal light where the cap will go.
 * The island used to draw every pylon as scaffolding while four of them were
 * live, which undersold exactly what it is there to show.
 */
export function buildIndieIsland(projects: Project[]): Cube[] {
  if (projects.length === 0) return [];
  const [ox, , oz] = islandPosition(INDIE_INDEX);
  const local: Cube[] = buildTerrain(T.seafoam, 9173);

  projects.forEach((p, i) => {
    const { x, z, height } = indiePylon(i, projects.length);
    const live = Boolean(p.url);
    const bright = mix(p.accent, "#ffffff", 0.4);
    const deep = mix(p.accent, "#000000", 0.35);

    for (let y = 1; y <= height; y++) {
      if (!live && y === height - 1) continue; // the course still to be built
      local.push(block(x, y, z, y % 2 ? p.accent : deep));
    }
    if (live) {
      local.push(block(x, height + 1, z, bright, [1.3, 0.35, 1.3])); // capstone
    } else {
      local.push(block(x + 1, 1, z, deep, [0.3, 2, 0.3])); // scaffold posts
      local.push(block(x - 1, 1, z, deep, [0.3, 2, 0.3]));
      local.push(block(x, height + 1, z, bright, [0.6, 0.8, 0.6])); // signal light
    }
  });

  return local.map((c) => ({
    position: [c.position[0] + ox, c.position[1], c.position[2] + oz] as [number, number, number],
    scale: c.scale,
    color: c.color,
  }));
}

/** All cubes for all islands, flattened into one list → one InstancedMesh. */
export function buildWorld(projects: Project[], illustratedIds: readonly string[] = []): Cube[] {
  const cubes: Cube[] = [];
  projects.forEach((p, i) => {
    const [ox, , oz] = islandPosition(i);
    const local = illustratedIds.includes(p.id) ? [] : [...buildTerrain(p.accent, i * 7919 + 13), ...buildStructure(p.structure, p.accent)];
    for (const c of local) {
      cubes.push({
        position: [c.position[0] + ox, c.position[1], c.position[2] + oz],
        scale: c.scale,
        color: c.color,
      });
    }
    if (i < projects.length - 1) cubes.push(...buildPath(i));
  });
  return cubes;
}
