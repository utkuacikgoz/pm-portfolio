import { CASE_STUDIES } from "../content";
import type { CaseStudy } from "../content/types";
import { T } from "../theme";

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

// The emblem hovering over an island. This is the one thing a visitor reads
// before any copy loads, so it has to say what the product WAS. These used to be
// abstract solids keyed off `structure` (an icosahedron in a ring, a dodecahedron
// in a ring), which looked like decoration rather than meaning: nothing about a
// dodecahedron says "gaming". Built from primitives rather than emoji so they do
// not depend on a platform emoji font inside WebGL.
export type MarkType =
  | "coin" // currency / fintech
  | "bag" // retail / ecommerce
  | "cross" // health
  | "joystick" // games
  | "growth" // marketplace / retention curve
  | "spark"; // generic placeholder (indie, pre-launch)

export interface Project {
  id: string;
  title: string; // short display name on the island / card
  tagline: string;
  kind: "employment" | "indie";
  published: boolean;
  accent: string; // palette accent (see src/theme.ts)
  structure: StructureType;
  mark?: MarkType; // emblem floating over the island (conveys the domain at a glance)
  content?: CaseStudy; // omitted for indie glimpses (no full case study yet)
  glimpse?: string; // teaser line shown on the glimpse panel for indie products
  story?: string; // one-line narrative caption for the fly-through tour
}

const C = CASE_STUDIES as Record<string, CaseStudy>;

// Order = travel order along the rail, strongest recruiter signal first.
export const PROJECTS: Project[] = [
  {
    id: "bilira",
    title: "BiLira",
    tagline: "Regulated fintech at scale · 35% faster AML review",
    kind: "employment",
    published: true,
    accent: T.blue,
    structure: "tower",
    mark: "coin",
    content: C.bilira,
    story: "The one where I made compliance fast enough to actually ship.",
  },
  {
    id: "mestores",
    title: "Mestores",
    tagline: "Ecommerce zero to one · +163% conversion, $500K recovered",
    kind: "employment",
    published: true,
    accent: T.gold,
    structure: "market",
    mark: "bag",
    content: C.mestores,
    story: "The one where a broken store started printing money again.",
  },
  {
    id: "apollo",
    title: "Apollo",
    tagline: "Healthcare transformation · $2M/yr saved",
    kind: "employment",
    published: true,
    accent: T.coral,
    structure: "campus",
    mark: "cross",
    content: C.apollo,
    story: "The one where healthcare ops stopped bleeding two million a year.",
  },
  {
    id: "la3eb",
    title: "La3eb",
    tagline: "Gaming super app · 6× DAU in 10 weeks",
    kind: "employment",
    published: true,
    accent: T.mauve,
    structure: "arcade",
    mark: "joystick",
    content: C.la3eb,
    story: "The one where a gaming app found six times its players in ten weeks.",
  },
  {
    id: "upshift",
    title: "Upshift",
    tagline: "HRtech marketplace · churn halved to 4%, built the PM function",
    kind: "employment",
    published: true,
    accent: T.seafoam,
    structure: "bridge",
    mark: "growth",
    content: C.upshift,
    story: "The one where I built the entire product function from scratch.",
  },

  // ── Indie products — live on the separate "ocean" island as coming-soon
  //    bubbles (not clickable). published:false keeps them off the main rail. ──
  {
    id: "signalbot",
    title: "Buyback Signal",
    tagline: "trading signal bot",
    kind: "indie",
    published: false,
    accent: T.seafoam,
    structure: "beacon",
    glimpse: "A bot that watches the market and flags buyback signals in real time.",
  },
  {
    id: "passats",
    title: "PassATS",
    tagline: "beat the resume robots",
    kind: "indie",
    published: false,
    accent: T.mauve,
    structure: "beacon",
    glimpse: "Helps job seekers get past automated tracking filters.",
  },
  {
    id: "cofoundr",
    title: "Cofoundr",
    tagline: "cofounder matching",
    kind: "indie",
    published: false,
    accent: T.gold,
    structure: "beacon",
    glimpse: "A matching app for finding a cofounder, the right person at the right time.",
  },
  // Mona is real but lower-signal; surface it by flipping published:true.
  {
    id: "mona",
    title: "Mona",
    tagline: "HR platform with no code · 150+ employees in 4 weeks",
    kind: "employment",
    published: false,
    accent: T.seafoam,
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
