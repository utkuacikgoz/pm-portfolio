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
  /**
   * The one number a visitor should leave the island with. It counts up under
   * the story caption on arrival, so the proof lands in the first seconds of
   * each stop. Explicit rather than parsed out of `tagline`, which a test keeps
   * consistent: the tagline must contain the formatted final value.
   */
  headline?: Headline;
}

export interface Headline {
  to: number;
  from?: number; // counts from here (default 0); "8% to 4%" counts down
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

/** The headline as printed, at any point of its count. */
export function formatHeadline(h: Headline, value = h.to): string {
  return `${h.prefix ?? ""}${value.toFixed(h.decimals ?? 0)}${h.suffix ?? ""}`;
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
    headline: { to: 35, suffix: "%", label: "less AML review time" },
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
    headline: { from: 0.8, to: 2.1, decimals: 1, suffix: "%", label: "conversion, up from 0.8%" },
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
    headline: { to: 2, prefix: "$", suffix: "M/yr", label: "saved" },
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
    headline: { from: 1, to: 6, suffix: "×", label: "daily active users in 10 weeks" },
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
    headline: { from: 8, to: 4, suffix: "%", label: "monthly churn, down from 8%" },
    story: "Building a product function around customer retention.",
  },

  // ── Indie products: pylons on the separate "ocean" island and rows on the
  //    resume shelf. published:false keeps them off the employment rail; a
  //    `url` is what makes one LIVE and links it out. Shipped ones lead. ──
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
    id: "psst",
    title: "Psst",
    tagline: "tap a friend, iPhone app",
    kind: "indie",
    published: false,
    accent: T.coral,
    structure: "beacon",
    url: "https://www.psstapp.fun",
    glimpse: "A free iPhone app for the people you are close to: tap a friend and they get a whispered psst that says thinking of you.",
  },
  {
    id: "rackrate",
    title: "Rack Rate",
    tagline: "AI coding cost comparison",
    kind: "indie",
    published: false,
    accent: T.blue,
    structure: "beacon",
    url: "https://rack-rate-flax.vercel.app",
    glimpse: "Finds the best AI coding model and monthly plan for your budget, from benchmark scores and cost per task, with every number sourced.",
  },
  {
    id: "littlemenace",
    title: "Little Menace",
    tagline: "gremlin pet, iPhone app",
    kind: "indie",
    published: false,
    accent: T.gold,
    structure: "beacon",
    url: "https://www.littlemenace.fun",
    glimpse: "An iPhone pet toy: adopt a tiny gremlin, pet it, feed it, let it nap and play three tiny games. Care earns points, neglect costs them.",
  },
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

/** Indie products: the ocean island's pylons and the resume shelf. */
export const INDIE_PROJECTS: Project[] = PROJECTS.filter((p) => p.kind === "indie" && !!p.glimpse);

/** Indie products that have actually shipped, so the shelf can say which. */
export function isLive(project: Project): boolean {
  return Boolean(project.url);
}

/**
 * "Live now: A, B and C. More are in development." for the indie panel, read off
 * the registry. The sentence was hand written and went stale every time a
 * product shipped, so it is derived instead.
 */
export function indieStatusLine(projects: Project[] = INDIE_PROJECTS): string {
  const live = projects.filter(isLive).map((p) => p.title);
  const names = live.length < 2 ? live.join("") : `${live.slice(0, -1).join(", ")} and ${live[live.length - 1]}`;
  const parts = [live.length ? `Live now: ${names}.` : "", live.length < projects.length ? "More are in development." : ""];
  return parts.filter(Boolean).join(" ");
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
