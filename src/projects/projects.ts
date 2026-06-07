import { CASE_STUDIES } from "../content";
import type { CaseStudy } from "../content/types";

// Silhouette archetype for the procedural low-poly island. The world renders
// every project from this one registry, so adding PassATS / Stats XI later is
// just flipping `published` and pointing at a content file.
export type StructureType =
  | "tower" // vault / exchange — fintech
  | "market" // stalls — e-commerce
  | "campus" // connected pavilions — healthcare
  | "arcade" // plaza — gaming / community
  | "bridge" // two-sided span — marketplace
  | "beacon"; // generic placeholder (indie, pre-launch)

export interface Project {
  id: string;
  title: string; // short display name on the island / card
  tagline: string;
  kind: "employment" | "indie";
  published: boolean;
  accent: string; // neon accent (matches brand palette)
  structure: StructureType;
  content?: CaseStudy; // omitted for indie glimpses (no full case study yet)
  glimpse?: string; // teaser line shown on the glimpse panel for indie products
}

const C = CASE_STUDIES as Record<string, CaseStudy>;

// Order = travel order along the rail, strongest recruiter signal first.
export const PROJECTS: Project[] = [
  {
    id: "bilira",
    title: "BiLira",
    tagline: "Regulated-fintech scale · −92% AML review time",
    kind: "employment",
    published: true,
    accent: "#FF0080",
    structure: "tower",
    content: C.bilira,
  },
  {
    id: "mestores",
    title: "Mestores",
    tagline: "E-commerce 0→1 · +163% conversion, $500K cart recovery",
    kind: "employment",
    published: true,
    accent: "#FFD700",
    structure: "market",
    content: C.mestores,
  },
  {
    id: "apollo",
    title: "Apollo",
    tagline: "Healthcare transformation · $2M/yr saved",
    kind: "employment",
    published: true,
    accent: "#FF6B35",
    structure: "campus",
    content: C.apollo,
  },
  {
    id: "la3eb",
    title: "La3eb",
    tagline: "Gaming super-app · 6× DAU in 10 weeks",
    kind: "employment",
    published: true,
    accent: "#00FFFF",
    structure: "arcade",
    content: C.la3eb,
  },
  {
    id: "upshift",
    title: "Upshift",
    tagline: "HRtech marketplace · churn 8%→4%, built the PM function",
    kind: "employment",
    published: true,
    accent: "#00FF88",
    structure: "bridge",
    content: C.upshift,
  },

  // ── Indie products — live on the separate "ocean" island as coming-soon
  //    bubbles (not clickable). published:false keeps them off the main rail. ──
  {
    id: "signalbot",
    title: "Buyback Signal",
    tagline: "trading-signal bot",
    kind: "indie",
    published: false,
    accent: "#00E5A0",
    structure: "beacon",
    glimpse: "A bot that watches the market and flags buyback signals in real time.",
  },
  {
    id: "passats",
    title: "PassATS",
    tagline: "beat the résumé robots",
    kind: "indie",
    published: false,
    accent: "#B14EFF",
    structure: "beacon",
    glimpse: "Helps job-seekers get past automated applicant-tracking filters.",
  },
  {
    id: "cofoundr",
    title: "Cofoundr",
    tagline: "co-founder matching",
    kind: "indie",
    published: false,
    accent: "#FFE600",
    structure: "beacon",
    glimpse: "A matching app for finding a co-founder — right person, right time.",
  },
  // Mona is real but lower-signal; surface it by flipping published:true.
  {
    id: "mona",
    title: "Mona",
    tagline: "No-code HR platform · 150+ employees in 4 weeks",
    kind: "employment",
    published: false,
    accent: "#00FF00",
    structure: "campus",
    content: C.mona,
  },
];

/** Employment projects on the main rail / flat map, in travel order. */
export const PUBLISHED_PROJECTS: Project[] = PROJECTS.filter((p) => p.published);

/** Indie products shown as coming-soon bubbles on the separate ocean island. */
export const INDIE_PROJECTS: Project[] = PROJECTS.filter((p) => p.kind === "indie" && !!p.glimpse);

export const projectIndexById = (id: string | undefined): number =>
  id ? PUBLISHED_PROJECTS.findIndex((p) => p.id === id) : -1;
