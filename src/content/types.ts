// Explicit shape for a case study. Previously the content objects were only
// structurally inferred (no interface), which let the bilira.ts metrics bug
// slip through. Beats use the canonical 5-step arc; per-beat viz fields are
// optional and rendered when present.

export interface Metric {
  label: string;
  before: number;
  after: number;
  unit: string;
  color: string;
}

export interface Decision {
  label: string;
  speed: number;
  risk: number;
  isChosen: boolean;
  color: string;
}

export interface Initiative {
  label: string;
  effort: number;
  impact: number;
  timeToValue: number;
  color: string;
}

export interface Stakeholder {
  name: string;
  role: string;
  color: string;
}

export interface Beat {
  id: string;
  label?: string; // overrides the id-derived section label (e.g. "Stablecoin & DeFi")
  body: string[];
  insight?: string; // sharp one-line takeaway, rendered as a callout
  metrics?: Metric[];
  decisions?: Decision[];
  initiatives?: Initiative[];
  stakeholders?: Stakeholder[];
}

export interface CaseStudy {
  id: string;
  title: string;
  sentimentScores?: number[];
  beats: Beat[];
}
