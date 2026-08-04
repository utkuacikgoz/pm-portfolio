import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";
import { SEO_ROUTES, SITE_URL, canonicalUrl, type SeoRoute } from "../src/seo/routes";

// This app is a single HTML file with client-side routing, so every URL used to
// serve the same <title>, description and og:image. Crawlers that run JS
// eventually see the right thing; link unfurlers (LinkedIn, Slack, X, WhatsApp)
// never do, and they are exactly where a portfolio gets shared.
//
// After the bundle is written, this plugin stamps a real static HTML file per
// route: same JS app, route-correct head and no-JS fallback. Vercel serves
// dist/resume/index.html for /resume before the SPA rewrite ever runs, so the
// preview is right on the first request.

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Replace the single line carrying data-seo="<key>". Tagged elements are
 * authored one per line in index.html precisely so this stays boring.
 */
function replaceTaggedLine(html: string, key: string, replacement: string): string {
  const pattern = new RegExp(`^([ \\t]*).*data-seo="${key}".*$`, "m");
  if (!pattern.test(html)) {
    throw new Error(`[seo] index.html is missing the data-seo="${key}" tag`);
  }
  return html.replace(pattern, (_match, indent: string) => `${indent}${replacement}`);
}

function replaceSummary(html: string, route: SeoRoute): string {
  const start = "<!--seo:summary-start-->";
  const end = "<!--seo:summary-end-->";
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1) throw new Error("[seo] index.html is missing the summary markers");

  // First line becomes the route's <h1>; a case study page whose only heading
  // says "Senior Technical Product Manager" wastes the strongest tag on it.
  const [heading, ...rest] = route.summary;
  const body = [
    `        <h1>${escapeHtml(heading.replace(/\.$/, ""))}</h1>`,
    ...rest.map((line) => `        <p>${escapeHtml(line)}</p>`),
  ].join("\n");
  return `${html.slice(0, from + start.length)}\n${body}\n        ${html.slice(to)}`;
}

function renderRoute(template: string, route: SeoRoute): string {
  const url = canonicalUrl(route.path);
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);

  let html = template;
  html = replaceTaggedLine(html, "title", `<title data-seo="title">${title}</title>`);
  html = replaceTaggedLine(
    html,
    "description",
    `<meta data-seo="description" name="description" content="${description}" />`
  );
  html = replaceTaggedLine(
    html,
    "canonical",
    `<link data-seo="canonical" rel="canonical" href="${url}" />`
  );
  html = replaceTaggedLine(
    html,
    "og:url",
    `<meta data-seo="og:url" property="og:url" content="${url}" />`
  );
  html = replaceTaggedLine(
    html,
    "og:title",
    `<meta data-seo="og:title" property="og:title" content="${title}" />`
  );
  html = replaceTaggedLine(
    html,
    "og:description",
    `<meta data-seo="og:description" property="og:description" content="${description}" />`
  );
  html = replaceTaggedLine(
    html,
    "twitter:title",
    `<meta data-seo="twitter:title" name="twitter:title" content="${title}" />`
  );
  html = replaceTaggedLine(
    html,
    "twitter:description",
    `<meta data-seo="twitter:description" name="twitter:description" content="${description}" />`
  );
  html = replaceTaggedLine(
    html,
    "route-jsonld",
    `<script data-seo="route-jsonld" type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`
  );
  return replaceSummary(html, route);
}

function renderSitemap(routes: SeoRoute[], lastmod: string): string {
  const urls = routes
    .map(
      (route) =>
        `  <url><loc>${canonicalUrl(route.path)}</loc><lastmod>${lastmod}</lastmod><priority>${route.priority}</priority></url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function renderRobots(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    "# Analytics proxy path, nothing to index behind it.",
    "Disallow: /ingest/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

export function seo(): Plugin {
  let outDir = "dist";

  return {
    name: "portfolio-seo",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      const template = await readFile(indexPath, "utf8");
      const lastmod = new Date().toISOString().slice(0, 10);

      for (const route of SEO_ROUTES) {
        const html = renderRoute(template, route);
        // "/" overwrites dist/index.html; every other route becomes a directory
        // with its own index.html, which Vercel serves as a static file.
        const target =
          route.path === "/"
            ? indexPath
            : path.join(outDir, route.path.replace(/^\//, ""), "index.html");
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, html, "utf8");
      }

      await writeFile(path.join(outDir, "sitemap.xml"), renderSitemap(SEO_ROUTES, lastmod), "utf8");
      await writeFile(path.join(outDir, "robots.txt"), renderRobots(), "utf8");

      this.info?.(`[seo] wrote ${SEO_ROUTES.length} prerendered routes, sitemap and robots.txt`);
    },
  };
}
