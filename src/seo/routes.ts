import { PUBLISHED_PROJECTS, attributionLine, type Project } from "../projects/projects";
import { SITE_URL, ROBOTS_CONTENT, INDEXABLE, canonicalUrl } from "./config";
import { CASE_STUDIES, type CaseStudyId } from "../content";
import type { Beat } from "../content/types";

// The registry no longer carries `content` (it would pin every case study into
// the entry chunk). This module is imported only by the build: the prerenderer
// and the seo-meta plugin, both under Node. So it reads the content map here.
const contentFor = (project: Project) => CASE_STUDIES[project.id as CaseStudyId];

export { SITE_URL, ROBOTS_CONTENT, INDEXABLE, canonicalUrl };

// Single source of truth for everything a crawler or a link preview reads.
// Imported twice on purpose:
//   - by the app, to keep <head> honest as the SPA navigates (see useSeo)
//   - by the build (scripts/vite-seo.ts), to write a real static HTML file per
//     route plus the sitemap, so LinkedIn, Slack and X see the right title even
//     though they never run our JavaScript.
// Keep it free of DOM and import.meta so the build can import it under Node.

const SITE_NAME = "Utku Acikgoz";
const AUTHOR = "Utku Acikgoz";
const JOB_TITLE = "Senior Technical Product Manager";
const EMAIL = "hello@utkuacikgoz.com";
const LINKEDIN = "https://linkedin.com/in/utkuacikgoz";

export interface SeoRoute {
  /** Route path, always starting with a slash. */
  path: string;
  title: string;
  description: string;
  /** Crawlable copy for the no-JS fallback of this route. */
  summary: string[];
  /** Sitemap priority. */
  priority: number;
  jsonLd: Record<string, unknown>[];
}

/** Search engines truncate around 160 characters; cut on a word boundary. */
function clamp(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

/** Taglines use middots for the world UI; prose reads better with commas. */
function prose(text: string): string {
  return text.replace(/\s*·\s*/g, ", ");
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

/** The sharpest line in a case study: an insight callout, else the opening claim. */
function lead(project: Project): string {
  const beats: Beat[] = contentFor(project)?.beats ?? [];
  const insight = beats.find((b) => b.insight)?.insight;
  if (insight) return insight;
  const body = beats[0]?.body?.[0];
  return body ? firstSentence(body) : "";
}

const person = {
  "@type": "Person",
  name: AUTHOR,
  jobTitle: JOB_TITLE,
  url: SITE_URL,
  email: EMAIL,
  sameAs: [LINKEDIN],
};

function projectRoute(project: Project, index: number): SeoRoute {
  const tagline = prose(project.tagline);
  const beats: Beat[] = contentFor(project)?.beats ?? [];

  return {
    path: `/p/${project.id}`,
    title: `${project.title} case study | ${AUTHOR}, Senior PM`,
    description: clamp(`${tagline}. ${lead(project)}`),
    summary: [
      `${project.title}: ${tagline}.`,
      ...(attributionLine(project) ? [attributionLine(project) as string] : []),
      ...beats.slice(0, 3).map((b) => b.body[0]).filter(Boolean),
    ],
    priority: 0.8,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: `${project.title} product case study`,
        headline: contentFor(project)?.title ?? project.title,
        abstract: clamp(`${tagline}. ${lead(project)}`),
        url: `${SITE_URL}/p/${project.id}`,
        author: person,
        creator: person,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Work", item: SITE_URL },
          {
            "@type": "ListItem",
            position: index + 2,
            name: project.title,
            item: `${SITE_URL}/p/${project.id}`,
          },
        ],
      },
    ],
  };
}

const HOME: SeoRoute = {
  path: "/",
  title: `${AUTHOR}, ${JOB_TITLE}`,
  description:
    "Senior product manager, 8+ years across fintech, blockchain, HRtech and SaaS, 11+ products shipped. Explore the work as an interactive world, or skip to the resume.",
  summary: [
    `${AUTHOR}, ${JOB_TITLE}.`,
    "8+ years across fintech, blockchain, HRtech and SaaS. 11+ products shipped.",
    ...PUBLISHED_PROJECTS.map(
      (p) => `${p.title}: ${prose(p.tagline)}.${attributionLine(p) ? ` ${attributionLine(p)}.` : ""}`
    ),
  ],
  priority: 1,
  jsonLd: [
    {
      "@context": "https://schema.org",
      ...person,
      description:
        "Senior product manager with 8+ years across fintech, blockchain, HRtech and SaaS; 11+ products shipped.",
      knowsAbout: [
        "Product Management",
        "Technical Product Management",
        "Fintech",
        "Blockchain",
        "Stablecoins",
        "Marketplaces",
        "Growth",
        "0 to 1 Product",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      author: person,
      inLanguage: "en",
    },
  ],
};

const RESUME: SeoRoute = {
  path: "/resume",
  title: `Resume | ${AUTHOR}, ${JOB_TITLE}`,
  description:
    "Resume of Utku Acikgoz, senior product manager. 11+ products shipped across fintech, blockchain, ecommerce and marketplaces, teams up to 25 across four countries.",
  summary: [
    `Resume of ${AUTHOR}, ${JOB_TITLE}.`,
    "8+ years and 11+ products shipped across fintech, blockchain, ecommerce, food delivery and marketplaces. Leads distributed teams of up to 25 people across Turkey, the UAE, KSA and the US. Certified Scrum Master (PSM I) and Product Owner (PSPO I).",
    ...PUBLISHED_PROJECTS.map((p) => `${p.title}: ${prose(p.tagline)}.`),
    `Contact: ${EMAIL}`,
  ],
  priority: 0.9,
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: `Resume of ${AUTHOR}`,
      url: `${SITE_URL}/resume`,
      mainEntity: person,
    },
  ],
};

/** Every indexable route, in sitemap order. */
export const SEO_ROUTES: SeoRoute[] = [HOME, RESUME, ...PUBLISHED_PROJECTS.map(projectRoute)];

/** Route metadata for a pathname, falling back to the home route. */
export function seoForPath(pathname: string): SeoRoute {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return SEO_ROUTES.find((route) => route.path === path) ?? HOME;
}

/** Absolute, parameter-free URL used for canonical and og:url. */
