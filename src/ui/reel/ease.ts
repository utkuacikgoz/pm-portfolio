// Easing library for the entry reel (spec section 2.4). The formulas are
// normative: three independent builds must produce the same frames, so do not
// substitute a bezier approximation for any of these.

export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);

/** seg(t, a, b) = clamp((t - a) / (b - a), 0, 1). */
export const seg = (t: number, a: number, b: number): number => clamp((t - a) / (b - a), 0, 1);

export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/** Size interpolation for carries: a * (b / a)^p. */
export const logLerp = (a: number, b: number, p: number): number => a * Math.pow(b / a, p);

export const linear = (p: number): number => p;
export const outExpo = (p: number): number => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const inCubic = (p: number): number => p * p * p;
export const outCubic = (p: number): number => {
  const q = 1 - p;
  return 1 - q * q * q;
};
export const inOutCubic = (p: number): number => {
  if (p < 0.5) return 4 * p * p * p;
  const q = -2 * p + 2;
  return 1 - (q * q * q) / 2;
};
export const outQuart = (p: number): number => {
  const q = 1 - p;
  return 1 - q * q * q * q;
};
export const inOutQuint = (p: number): number => {
  if (p < 0.5) return 16 * p * p * p * p * p;
  const q = -2 * p + 2;
  return 1 - (q * q * q * q * q) / 2;
};
const BACK_C1 = 1.15;
const BACK_C3 = BACK_C1 + 1;
export const outBack = (p: number): number => {
  const q = p - 1;
  return 1 + BACK_C3 * q * q * q + BACK_C1 * q * q;
};

/**
 * Odometer landing offset, in digit pitches: a damped spring (omega 52.4 rad/s,
 * decay 20/s) that is exactly 0 at u = 0.18, where sin(3 pi) = 0.
 */
export const land = (u: number): number =>
  u < 0 || u >= 0.18 ? 0 : 0.06 * Math.exp(-u / 0.05) * Math.sin((2 * Math.PI * u) / 0.12);
