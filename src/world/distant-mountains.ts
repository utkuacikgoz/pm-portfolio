import { EMP_COUNT, SPACING, rng } from "./geometry";

interface DistantPeak {
  x: number;
  z: number;
  h: number;
  w: number;
}

/** Stable visual and collision data shared by the renderer and surf physics. */
function buildDistantPeaks(): DistantPeak[] {
  const cx = ((EMP_COUNT - 1) / 2) * SPACING;
  const peaks: DistantPeak[] = [];
  const random = rng(54017);
  const count = 26;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.16;
    const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
    if (Math.abs(normalized) < 0.7) continue;
    const radius = 155 + random() * 50;
    peaks.push({
      x: cx + Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      h: 26 + random() * 32,
      w: 28 + random() * 24,
    });
  }
  return peaks;
}

export const DISTANT_PEAKS = buildDistantPeaks();
