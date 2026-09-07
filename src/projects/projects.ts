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
  /**
   * Where this work actually happened, and when. Shown wherever the project is,
   * because the CV lists four employers (BiLira, Upshift, Lean Scale,
   * Technolera) while the world shows five islands: Mestores, Apollo and La3eb
   * were client engagements during Lean Scale. Without this a recruiter reading
   * both documents finds three roles that do not exist in the employment
   * history, which costs more credibility than the studies earn.
   */
  role?: string; // title held, matching the CV
  org?: string; // employer of record
  period?: string; // years, matching the CV
  clientWork?: boolean; // engagement delivered for a client, not a staff role
  // NOTE: no `content` field. The case-study prose is looked up by `id` from
  // `src/content` inside the LAZY ProjectPanel chunk instead of being referenced
  // here. A static reference from this registry put the full text of all six
  // case studies into the entry chunk for every visitor, including the flat
  // mobile path that never opens one. Adding a project is unchanged: add a
  // content file keyed by the same id, add a row here, flip `published`.
  glimpse?: string; // teaser line shown on the glimpse panel for indie products
  /**
   * Where the thing actually is, for an indie product that has shipped.
   *
   * This is what separates a bet from a product. Everything on the indie shelf
   * used to read "COMING SOON" whether or not it existed, which costs exactly
   * the credibility the shelf is there to earn: a live product described as
   * forthcoming is worth less than not mentioning it. A row with a `url` is
   * live and links out; a row without one is still a bet and still says so.
   */
  url?: string;
  story?: string; // one-line narrative caption for the fly-through tour
}


// Order = travel order along the rail, strongest recruiter signal first.
export const PROJECTS: Project[] = [
  {
    id: "bilira",
    role: "Senior Product Manager",
    org: "BiLira",
    period: "2025 to present",
    title: "BiLira",
    tagline: "Fintech infrastructure · 35% less AML review time",
    kind: "employment",
    published: true,
    accent: T.blue,
    structure: "tower",
    mark: "coin",
    story: "Making compliance faster with automation and human review.",
  },
  {
    id: "mestores",
    role: "Product Manager",
    org: "Lean Scale",
    period: "2020 to 2022",
    clientWork: true,
    title: "Mestores",
    tagline: "Ecommerce modernization · conversion 0.8% to 2.1%",
    kind: "employment",
    published: true,
    accent: T.gold,
    structure: "market",
    mark: "bag",
    story: "Improving conversion without rebuilding the entire platform.",
  },
  {
    id: "apollo",
    role: "Product Manager",
    org: "Lean Scale",
    period: "2020 to 2022",
    clientWork: true,
    title: "Apollo",
    tagline: "Connected healthcare operations · $2M/yr saved",
    kind: "employment",
    published: true,
    accent: T.coral,
    structure: "campus",
    mark: "cross",
    story: "Connecting hospital, pharmacy and inventory workflows.",
  },
  {
    id: "la3eb",
    role: "Product Manager",
    org: "Lean Scale",
    period: "2020 to 2022",
    clientWork: true,
    title: "La3eb",
    tagline: "Gaming community · 6× daily active users in 10 weeks",
    kind: "employment",
    published: true,
    accent: T.mauve,
    structure: "arcade",
    mark: "joystick",
    story: "Building a gaming community around the PS5 launch.",
  },
  {
    id: "upshift",
    role: "Senior Product Manager",
    org: "Upshift",
    period: "2022 to 2025",
    title: "Upshift",
    tagline: "Marketplace retention · monthly churn 8% to 4%",
    kind: "employment",
    published: true,
    accent: T.seafoam,
    structure: "bridge",
    mark: "growth",
    story: "Building a product function around customer retention.",
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
    tagline: "resume feedback and ATS checks",
    kind: "indie",
    published: false,
    accent: T.mauve,
    structure: "beacon",
    url: "https://www.passats.pro",
    glimpse: "Checks resume structure, missing keywords and weak experience bullets. Live now.",
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
  },
];

/** Employment projects on the main rail / flat map, in travel order. */
export const PUBLISHED_PROJECTS: Project[] = PROJECTS.filter((p) => p.published);

/** Indie products shown as coming-soon bubbles on the separate ocean island. */
export const INDIE_PROJECTS: Project[] = PROJECTS.filter((p) => p.kind === "indie" && !!p.glimpse);

/** Indie products that have actually shipped, so the shelf can say which. */
export function isLive(project: Project): boolean {
  return Boolean(project.url);
}

/** A published project by registry id, or null. */
export function projectById(id: string): Project | null {
  return PUBLISHED_PROJECTS.find((p) => p.id === id) ?? null;
}

/**
 * One line placing a project in the CV: who you were, where, when. Client
 * engagements say so explicitly, so nothing implies a staff role that the
 * employment history does not show.
 */
export function attributionLine(project: Project): string | null {
  if (!project.role || !project.org || !project.period) return null;
  const where = project.clientWork ? `${project.org}, client engagement` : project.org;
  return `${project.role}, ${where}, ${project.period}`;
}

export const projectIndexById = (id: string | undefined): number =>
  id ? PUBLISHED_PROJECTS.findIndex((p) => p.id === id) : -1;
