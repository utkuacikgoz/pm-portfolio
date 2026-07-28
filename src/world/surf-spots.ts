// Legendary breaks scattered across the free-surf ocean, so roaming becomes a
// little world tour instead of an empty plane. Positions live inside the
// SurfController bounds (x[-60,220], z[-130,130]) and are spread in different
// directions from the spawn near the islands, close enough that you actually
// cross them while roaming (the reported "never reach a spot" problem). Spellings
// are plain Latin (house rule: no accents in any rendered copy).

export interface SurfSpot {
  id: string;
  name: string;
  blurb: string; // one line, dash-free, accent-free
  pos: [number, number]; // [x, z] landmark origin (beacon + label anchor)
  take: [number, number]; // [x, z] the wave's takeoff point — where you catch it
  accent: string; // neon marker + beacon color
}

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "teahupoo",
    name: "Teahupoo",
    blurb: "Tahiti. A slab that breaks below sea level.",
    pos: [40, 58],
    take: [40, 58],
    accent: "#FF0080",
  },
  {
    id: "bondi",
    name: "Bondi",
    blurb: "Sydney, Australia. Where half the world learns to surf.",
    pos: [0, -58],
    take: [0, -55],
    accent: "#00FF88",
  },
  {
    id: "impossibles",
    name: "Impossibles",
    blurb: "Bali, Indonesia. A long peeling limestone wall.",
    pos: [-25, 25],
    take: [-22, 27],
    accent: "#FFD700",
  },
  {
    id: "pipeline",
    name: "Pipeline",
    blurb: "Oahu, Hawaii. The heaviest reef barrel on Earth.",
    pos: [120, 48],
    take: [122, 46],
    accent: "#FF6B35",
  },
  {
    id: "nazare",
    name: "Nazare",
    blurb: "Portugal. The biggest wave anyone has paddled.",
    pos: [155, -72],
    take: [162, -71],
    accent: "#00CFFF",
  },
];

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
