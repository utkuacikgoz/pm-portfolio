import type { Project, StructureType } from "../projects/projects";

// Distance between island centers along the rail (X axis).
export const SPACING = 16;

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

// Rounded floating-island base: a few discs of cubes tapering downward.
function buildTerrain(cx: number, accent: string, seed: number): Cube[] {
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
        // gentle height jitter only on the visible top layer
        const jitter = layer.y === 0 && rand() > 0.82 ? 0.18 : 0;
        cubes.push({
          position: [cx + dx, layer.y + jitter / 2, dz],
          scale: [1, 1 + jitter, 1],
          color: layer.color,
        });
      }
    }
  }
  return cubes;
}

// Stack helper.
function block(
  cx: number,
  x: number,
  y: number,
  z: number,
  color: string,
  scale: [number, number, number] = [1, 1, 1]
): Cube {
  return { position: [cx + x, y + scale[1] / 2 - 0.5, z], scale, color };
}

function buildStructure(cx: number, type: StructureType, accent: string): Cube[] {
  const bright = mix(accent, "#ffffff", 0.35);
  const out: Cube[] = [];
  switch (type) {
    case "tower": {
      // exchange / vault — a tapering stack with a bright cap
      const h = 7;
      for (let y = 1; y <= h; y++) {
        const s = y < h - 1 ? 2 : 1;
        out.push(block(cx, 0, y, 0, y === h ? bright : accent, [s, 1, s]));
      }
      out.push(block(cx, 2, 1, 1, accent), block(cx, -2, 1, -1, accent));
      break;
    }
    case "market": {
      // stalls with peaked caps
      const spots: [number, number][] = [
        [-2, -1],
        [1, -2],
        [2, 1],
        [-1, 2],
      ];
      spots.forEach(([x, z], i) => {
        out.push(block(cx, x, 1, z, accent, [2, 1, 2]));
        out.push(block(cx, x, 2, z, i % 2 ? bright : accent));
      });
      break;
    }
    case "campus": {
      // low connected pavilions
      out.push(block(cx, -2, 1, 0, accent, [2, 1, 3]));
      out.push(block(cx, 1, 1, 0, accent, [2, 1, 4]));
      out.push(block(cx, 0, 1, 0, bright, [1, 1, 1])); // connector
      out.push(block(cx, -2, 2, 0, bright));
      out.push(block(cx, 1, 2, 1, bright));
      break;
    }
    case "arcade": {
      // central block ringed by pillars (community plaza)
      out.push(block(cx, 0, 1, 0, accent, [2, 3, 2]));
      out.push(block(cx, 0, 4, 0, bright));
      const ring: [number, number][] = [
        [-2.5, -2.5],
        [2.5, -2.5],
        [2.5, 2.5],
        [-2.5, 2.5],
      ];
      ring.forEach(([x, z]) => out.push(block(cx, x, 1, z, accent, [1, 2, 1])));
      break;
    }
    case "bridge": {
      // two platforms joined by a span (two-sided marketplace)
      out.push(block(cx, -2.5, 1, 0, accent, [2, 2, 2]));
      out.push(block(cx, 2.5, 1, 0, accent, [2, 2, 2]));
      for (let x = -1.5; x <= 1.5; x++) out.push(block(cx, x, 2, 0, bright));
      break;
    }
    case "beacon":
    default: {
      out.push(block(cx, 0, 1, 0, accent, [1, 4, 1]));
      out.push(block(cx, 0, 5, 0, bright));
      break;
    }
  }
  return out;
}

/** All cubes for all islands, flattened into one list → one InstancedMesh. */
export function buildWorld(projects: Project[]): Cube[] {
  const cubes: Cube[] = [];
  projects.forEach((p, i) => {
    const cx = i * SPACING;
    cubes.push(...buildTerrain(cx, p.accent, i * 7919 + 13));
    cubes.push(...buildStructure(cx, p.structure, p.accent));
  });
  return cubes;
}
