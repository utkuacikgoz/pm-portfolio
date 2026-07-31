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
  ride: { lift: number; direction: [number, number] };
  accent: string; // neon marker + beacon color
}

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: "teahupoo",
    name: "Teahupoo",
    blurb: "Tahiti. A slab that breaks below sea level.",
    pos: [40, 58],
    take: [40, 58],
    ride: { lift: 1.7, direction: [80, -10] },
    accent: "#6E86D6",
  },
  {
    id: "bondi",
    name: "Bondi",
    blurb: "Sydney, Australia. Where half the world learns to surf.",
    pos: [0, -58],
    take: [0, -55],
    ride: { lift: 0.9, direction: [-25, 83] },
    accent: "#3FA46A",
  },
  {
    id: "impossibles",
    name: "Impossibles",
    blurb: "Bali, Indonesia. A long peeling limestone wall.",
    pos: [-25, 25],
    take: [-22, 27],
    ride: { lift: 1.8, direction: [85, -25] },
    accent: "#E0A45C",
  },
  {
    id: "pipeline",
    name: "Pipeline",
    blurb: "Oahu, Hawaii. The heaviest reef barrel on Earth.",
    pos: [120, 48],
    take: [122, 46],
    ride: { lift: 2.3, direction: [35, -120] },
    accent: "#E7684A",
  },
  {
    id: "nazare",
    name: "Nazare",
    blurb: "Portugal. The biggest wave anyone has paddled.",
    pos: [155, -72],
    take: [162, -71],
    ride: { lift: 4.4, direction: [-155, 14] },
    accent: "#6E86D6",
  },
];

// Open-water launch: Bondi is ahead, but the player reaches it under their own
// control rather than surf mode beginning inside its catch zone.
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
