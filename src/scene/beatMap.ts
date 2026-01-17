export type BeatId =
  | "chaos"
  | "constraints"
  | "decisions"
  | "deterministic"
  | "proof";

export type SceneState =
  | "chaos"
  | "constraints"
  | "decisions"
  | "deterministic"
  | "proof";

export const BEAT_TO_SCENE: Record<BeatId, SceneState> = {
  chaos: "chaos",
  constraints: "constraints",
  decisions: "decisions",
  deterministic: "deterministic",
  proof: "proof",
};
