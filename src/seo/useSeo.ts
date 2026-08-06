import { useEffect } from "react";
import { ROBOTS_CONTENT, canonicalUrl, seoForPath } from "./routes";

// The build writes a static HTML file per route (scripts/vite-seo.ts), which is
// what link unfurlers and non-JS crawlers read. This hook covers the other half:
// once the SPA takes over and the visitor navigates client side, the head has to
// keep telling the truth (shared links, browser history, JS-running crawlers).

function upsertTag(selector: string, create: () => HTMLElement): HTMLElement {
  const existing = document.head.querySelector<HTMLElement>(selector);
  if (existing) return existing;
  const created = create();
  document.head.appendChild(created);
  return created;
}

function setMeta(kind: "name" | "property", key: string, content: string): void {
  const tag = upsertTag(`meta[${kind}="${key}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute(kind, key);
    return meta;
  });
  tag.setAttribute("content", content);
}

/** Keep <head> in sync with the current route. */
export function useSeo(pathname: string): void {
  useEffect(() => {
    const route = seoForPath(pathname);
    const url = canonicalUrl(route.path);

    document.title = route.title;
    setMeta("name", "description", route.description);
    setMeta("name", "robots", ROBOTS_CONTENT);
    setMeta("property", "og:url", url);
    setMeta("property", "og:title", route.title);
    setMeta("property", "og:description", route.description);
    setMeta("name", "twitter:title", route.title);
    setMeta("name", "twitter:description", route.description);

    const canonical = upsertTag('link[rel="canonical"]', () => {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      return link;
    });
    canonical.setAttribute("href", url);

    // One script owns route-level structured data, replaced wholesale on nav so
    // a case study never inherits the previous one's schema.
    const jsonLd = upsertTag('script[data-seo="route-jsonld"]', () => {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo", "route-jsonld");
      return script;
    });
    jsonLd.textContent = JSON.stringify(route.jsonLd);
  }, [pathname]);
}
