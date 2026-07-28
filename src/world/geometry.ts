import { PUBLISHED_PROJECTS } from "../projects/projects";
import type { Project, StructureType } from "../projects/projects";

// Distance between island centers along the rail (X axis). Roomier than a tight
// diorama so the world reads as a place you travel through.
export const SPACING = 22;
export const EMP_COUNT = PUBLISHED_PROJECTS.length;
export const WATER_GAP = 46; // ocean you surf across to reach the indie island
export const WATER_Y = -3.4;
export const INDIE_INDEX = EMP_COUNT; // the separate indie island sits past the gap

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

export interface Cube {
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
function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const TERRAIN_DARK = "#0e1019";
const TERRAIN_MID = "#161a27";

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
      color: "#26304a",
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
      break;
    }
    case "campus": {
      out.push(block(-2, 1, 0, accent, [2, 1, 3]));
      out.push(block(1.5, 1, 0, deep, [2, 1, 4]));
      out.push(block(-0.2, 1, 0, bright, [1, 1, 1])); // connector
      out.push(block(-2, 2, 0, bright));
      out.push(block(1.5, 2, 1, bright));
      out.push(block(1.5, 2, -1, accent));
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
      out.push(block(-2.6, 1, 0, accent, [2, 2, 2]));
      out.push(block(2.6, 1, 0, deep, [2, 2, 2]));
      for (let x = -1.5; x <= 1.5; x++) out.push(block(x, 2, 0, bright));
      out.push(block(-2.6, 3, 0, bright, [0.5, 0.6, 0.5]));
      out.push(block(2.6, 3, 0, bright, [0.5, 0.6, 0.5]));
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

/** All cubes for all islands, flattened into one list → one InstancedMesh. */
export function buildWorld(projects: Project[]): Cube[] {
  const cubes: Cube[] = [];
  projects.forEach((p, i) => {
    const [ox, , oz] = islandPosition(i);
    const local = [...buildTerrain(p.accent, i * 7919 + 13), ...buildStructure(p.structure, p.accent)];
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
