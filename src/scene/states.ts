export type SceneId =
  | "chaos"
  | "constraints"
  | "decisions"
  | "deterministic"
  | "proof";

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function smoothstep(t: number) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

// Scene thresholds in scroll progress
export const SCENES: { id: SceneId; start: number; end: number }[] = [
  { id: "chaos", start: 0.0, end: 0.2 },
  { id: "constraints", start: 0.2, end: 0.4 },
  { id: "decisions", start: 0.4, end: 0.6 },
  { id: "deterministic", start: 0.6, end: 0.85 },
  { id: "proof", start: 0.85, end: 1.0 },
];

export function sceneForProgress(p: number): SceneId {
  const hit = SCENES.find((s) => p >= s.start && p < s.end);
  return hit?.id ?? "proof";
}

export function localT(p: number, sceneId: SceneId) {
  const s = SCENES.find((x) => x.id === sceneId);
  if (!s) return 0;
  const span = Math.max(1e-6, s.end - s.start);
  return clamp01((p - s.start) / span);
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}
