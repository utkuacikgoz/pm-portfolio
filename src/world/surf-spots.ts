// Legendary breaks scattered across the free-surf ocean, so roaming becomes a
// little world tour instead of an empty plane. Positions live inside the
// SurfController bounds (x[-60,220], z[-130,130]) and are spread out on purpose
// so surfing between them is a journey. Spellings are plain Latin (house rule:
// no accents in any rendered copy) — "Nazare", "Teahupoo".

export interface SurfSpot {
  id: string;
  name: string;
  blurb: string; // one line, dash-free, accent-free
  pos: [number, number]; // [x, z] on the water plane
  accent: string; // neon marker + beacon color
}

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "nazare",
    name: "Nazare",
    blurb: "Portugal. The biggest wave anyone has paddled.",
    pos: [200, -100],
    accent: "#00CFFF",
  },
  {
    id: "pipeline",
    name: "Pipeline",
    blurb: "Oahu, Hawaii. The heaviest reef barrel on Earth.",
    pos: [180, 90],
    accent: "#FF6B35",
  },
  {
    id: "teahupoo",
    name: "Teahupoo",
    blurb: "Tahiti. A slab that breaks below sea level.",
    pos: [20, 110],
    accent: "#FF0080",
  },
  {
    id: "impossibles",
    name: "Impossibles",
    blurb: "Bali, Indonesia. A long peeling limestone wall.",
    pos: [-50, 60],
    accent: "#FFD700",
  },
  {
    id: "bondi",
    name: "Bondi",
    blurb: "Sydney, Australia. Where half the world learns to surf.",
    pos: [-40, -90],
    accent: "#00FF88",
  },
];

// Nearest spot within `radius` units of (x,z), or null when the surfer is out in
// open water. Squared distance so we skip the per-call sqrt.
export function nearestSpot(x: number, z: number, radius = 40): SurfSpot | null {
  let best: SurfSpot | null = null;
  let bestSq = radius * radius;
  for (const s of SURF_SPOTS) {
    const dx = x - s.pos[0];
    const dz = z - s.pos[1];
    const sq = dx * dx + dz * dz;
    if (sq < bestSq) {
      bestSq = sq;
      best = s;
    }
  }
  return best;
}
