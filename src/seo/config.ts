// The parts of the SEO contract that do NOT depend on the project registry.
//
// Split out of `routes.ts` deliberately. `useSeo` runs in the browser on every
// route and needs SITE_URL, the robots value and canonicalUrl; importing those
// from `routes.ts` also pulled in PUBLISHED_PROJECTS, and through it the full
// text of all six case studies, into the entry chunk every visitor downloads.
// Keep this module free of any registry or content import.

export const SITE_URL = "https://utkuacikgoz.com";

/**
 * Whether this site wants to be in search results. Off on purpose: the case
 * studies carry numbers the CV does not, and traffic here comes from links Utku
 * pastes deliberately (LinkedIn, DMs, applications), not from ranking.
 *
 * Note the mechanism. Staying out of search means "crawlable but noindex", NOT
 * a robots.txt Disallow: blocking the crawl stops Google from ever reading the
 * noindex, and it can still list a bare URL it found linked elsewhere. So
 * robots.txt keeps letting crawlers in, and every page says noindex.
 *
 * Link unfurlers (LinkedIn, Slack, WhatsApp) ignore robots directives, so all
 * the per-route titles and OG cards keep working either way.
 *
 * Flip to true to be indexed: it turns the meta to index,follow, restores the
 * sitemap and advertises it in robots.txt.
 */
export const INDEXABLE = false;

/** Value for the robots meta tag on every route. */
export const ROBOTS_CONTENT = INDEXABLE
  ? "index, follow, max-image-preview:large, max-snippet:-1"
  : "noindex, follow";

export function canonicalUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
