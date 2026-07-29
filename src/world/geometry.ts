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

// Monument Valley plinths: warm pale stone in tiers, not dark rubble. The island
// is architecture too — a base the monument stands on — so it steps cleanly
// instead of looking eroded.
const TERRAIN_DARK = "#C3B49E";
const TERRAIN_MID = "#DCCFBC";

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
      color: "#E4D8C6",
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

// ── The monument kit ─────────────────────────────────────────────────────────
// Every island used to be a bespoke pile of five to ten cubes — a tapering
// stack, four stalls, two slabs, a pole — with nothing in common, which is why
// they read as random objects rather than one place. They are now composed from
// a single Monument Valley vocabulary: plinths, stairs, arches, colonnades and
// crowned towers. Islands differ by ARRANGEMENT, not by inventing new forms.
//
// Everything stays cube-only on purpose: all islands share one drei <Instances>
// (a single draw call), so a curved arch would mean a second instanced geometry.
// Stepping an arch out of cubes keeps that intact and suits the voxel heritage.

/** Flat platform. The floor every other piece stands on. */
function terrace(x: number, y: number, z: number, w: number, dp: number, color: string): Cube[] {
  return [block(x, y, z, color, [w, 0.5, dp])];
}

/** A flight of steps climbing `steps` units along +X (or -X when dir is -1). */
function stair(x: number, y: number, z: number, steps: number, dir: 1 | -1, color: string): Cube[] {
  const out: Cube[] = [];
  for (let s = 0; s < steps; s++) {
    out.push(block(x + dir * s * 0.7, y + s * 0.5, z, color, [0.7, 0.5, 1.6]));
  }
  return out;
}

/** Two legs and a stepped span. The signature MV silhouette. */
function arch(x: number, y: number, z: number, h: number, span: number, color: string, cap: string): Cube[] {
  const out: Cube[] = [];
  const half = span / 2;
  for (let s = 0; s < h; s++) {
    out.push(block(x - half, y + s, z, color, [0.7, 1, 0.7]));
    out.push(block(x + half, y + s, z, color, [0.7, 1, 0.7]));
  }
  // Shoulders step inward, then a flat lintel — a voxel arch, not a box.
  out.push(block(x - half + 0.45, y + h, z, cap, [0.6, 1, 0.7]));
  out.push(block(x + half - 0.45, y + h, z, cap, [0.6, 1, 0.7]));
  out.push(block(x, y + h + 0.6, z, cap, [span - 0.2, 0.7, 0.7]));
  return out;
}

/** A run of arches: the literal meaning of "arcade". */
function colonnade(x: number, y: number, z: number, count: number, color: string, cap: string): Cube[] {
  const out: Cube[] = [];
  for (let i = 0; i < count; i++) {
    out.push(...arch(x, y, z + i * 2.1 - ((count - 1) * 2.1) / 2, 2, 2.2, color, cap));
  }
  return out;
}

/** Column with a stepped crown — the vertical punctuation of the skyline. */
function tower(x: number, y: number, z: number, h: number, color: string, cap: string): Cube[] {
  const out: Cube[] = [];
  for (let s = 0; s < h; s++) {
    const w = s > h - 3 ? 1.1 : 1.5;
    out.push(block(x, y + s, z, s % 2 ? color : mix(color, cap, 0.25), [w, 1, w]));
  }
  out.push(block(x, y + h, z, cap, [1.7, 0.4, 1.7])); // cornice
  out.push(block(x, y + h + 0.4, z, cap, [0.9, 0.9, 0.9])); // crown
  return out;
}

function buildStructure(type: StructureType, accent: string): Cube[] {
  // Monument faces are pastel: lighten the (text-safe, therefore fairly deep)
  // project accent heavily at the draw site so the architecture stays high-key
  // without compromising the accent's legibility as text elsewhere.
  const face = mix(accent, "#ffffff", 0.55);
  const cap = mix(accent, "#ffffff", 0.78);
  const shade = mix(accent, "#ffffff", 0.3);
  const out: Cube[] = [];
  switch (type) {
    case "tower": {
      // Exchange / vault: the tallest monument, approached by a stair.
      out.push(...terrace(0, 0.5, 0, 6, 6, shade));
      out.push(...tower(0, 1, 0, 8, face, cap));
      out.push(...stair(-2.6, 1, 1.2, 4, 1, cap));
      out.push(...arch(0, 1, 2.6, 2, 2.4, face, cap));
      break;
    }
    case "market": {
      // A colonnade over a broad terrace: many small openings, human scale.
      out.push(...terrace(0, 0.5, 0, 7, 7, shade));
      out.push(...colonnade(-1.6, 1, 0, 3, face, cap));
      out.push(...terrace(2, 1.2, 0, 2.6, 5, cap));
      out.push(...tower(2, 1.7, -1.6, 3, face, cap));
      break;
    }
    case "campus": {
      // Two terraces at different heights, joined by a stair. A place you cross.
      out.push(...terrace(-2, 0.5, 0, 4, 6, shade));
      out.push(...terrace(2.4, 2.5, 0, 4, 5, face));
      out.push(...stair(-0.2, 1, 0, 4, 1, cap));
      out.push(...tower(-2.4, 1, -1.4, 4, face, cap));
      out.push(...arch(2.4, 3, 1.6, 2, 2.4, cap, face));
      break;
    }
    case "arcade": {
      // The arcade proper: a long run of arches with a tower anchoring one end.
      out.push(...terrace(0, 0.5, 0, 6, 8, shade));
      out.push(...colonnade(0, 1, 0, 4, face, cap));
      out.push(...tower(-2.4, 1, 0, 6, face, cap));
      break;
    }
    case "bridge": {
      // Two towers spanned by a raised walkway.
      out.push(...terrace(0, 0.5, 0, 8, 4, shade));
      out.push(...tower(-2.8, 1, 0, 5, face, cap));
      out.push(...tower(2.8, 1, 0, 5, face, cap));
      out.push(...terrace(0, 5, 0, 5, 1.4, cap)); // the span
      out.push(...stair(-1.4, 1, 1.6, 4, 1, cap));
      break;
    }
    case "beacon":
    default: {
      // The indie island: a single slim tower, deliberately quieter.
      out.push(...terrace(0, 0.5, 0, 4, 4, shade));
      out.push(...tower(0, 1, 0, 5, face, cap));
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
