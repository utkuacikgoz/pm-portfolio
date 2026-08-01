import { EMP_COUNT, SPACING, rng } from "./geometry";

interface DistantPeak {
  x: number;
  z: number;
  h: number;
  w: number;
}

// The ring sits well outside SURF_BOUNDS so the peaks read as horizon, not as
// scenery you can paddle into. At the old radius of 155 against a z wall of 130
// their collision volumes reached into the playable water: you could bump a
// "distant" mountain, which is what made the ocean feel small. `surf-journey`
// asserts the separation so tuning either number cannot silently close the gap.
// Scaled up with the distance, or they would be specks on the horizon.
const RING_INNER = 450;
const RING_SPREAD = 70;

/** Stable visual and collision data shared by the renderer and surf physics. */
function buildDistantPeaks(): DistantPeak[] {
  const cx = ((EMP_COUNT - 1) / 2) * SPACING;
  const peaks: DistantPeak[] = [];
  const random = rng(54017);
  const count = 42; // more of them, since the ring is now much longer
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.16;
    const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(normalized) < 0.7) continue; // leave the sunset end of the rail open
    const radius = RING_INNER + random() * RING_SPREAD;
    peaks.push({
      x: cx + Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      h: 55 + random() * 65,
      w: 38 + random() * 32,
    });
  }
  return peaks;
}

export const DISTANT_PEAKS = buildDistantPeaks();
