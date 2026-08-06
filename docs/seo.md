# SEO

The site is a client-rendered SPA, so search engines and (more importantly) link
unfurlers need help. Three pieces do the work.

## Indexing is OFF on purpose

`INDEXABLE = false` in `src/seo/routes.ts`. Every page serves
`<meta name="robots" content="noindex, follow">` and no sitemap is emitted.

Why: the case studies carry numbers the CV does not, and traffic here comes from
links pasted deliberately (LinkedIn, DMs, applications) rather than from ranking
for anything. Staying out of search keeps the framing under Utku's control.

**Do not "improve" this by adding `Disallow: /` to robots.txt.** Blocking the
crawl stops Google from ever reading the noindex, and it can still list a bare
URL it discovered through a link elsewhere. Crawlable plus noindex is the
combination that actually keeps a page out. robots.txt therefore still says
`Allow: /`.

Link unfurlers (LinkedIn, Slack, WhatsApp) ignore robots directives, so all the
per-route titles and OG cards below keep working while noindex is on.

Flipping `INDEXABLE` to true switches the meta to `index, follow`, restores
`sitemap.xml` and advertises it in robots.txt. Nothing else needs touching.

## 1. One source of truth: `src/seo/routes.ts`

Title, description, no-JS summary, sitemap priority and JSON-LD for every
indexable route. Case-study routes are **derived from the project registry**, so
publishing a project in `src/projects/projects.ts` automatically produces its
metadata, its prerendered page and its sitemap entry. Nothing to remember.

The file is deliberately free of DOM and `import.meta`, because the build
imports it under Node.

## 2. Build-time prerender: `scripts/vite-seo.ts`

A Vite plugin that runs after the bundle is written and, for every route,
stamps a static HTML file with route-correct `<title>`, description, canonical,
Open Graph, Twitter card, JSON-LD and no-JS summary:

```
dist/index.html            /
dist/resume/index.html     /resume
dist/p/bilira/index.html   /p/bilira
...
dist/robots.txt            generated
dist/sitemap.xml           only when INDEXABLE is true
```

Vercel checks the filesystem before the SPA rewrite in `vercel.json`, so
`/p/bilira` serves its own HTML file and only falls back to the SPA rewrite for
unknown paths. LinkedIn, Slack, X and WhatsApp see the correct preview without
running any JavaScript.

Tags that get rewritten carry `data-seo="<key>"` in `index.html` and **must stay
on one line each** (the plugin replaces whole lines and throws if a key is
missing, so a broken template fails the build rather than shipping wrong meta).

## 3. Runtime head sync: `src/seo/useSeo.ts`

Once the SPA is driving, client-side navigation updates title, description,
canonical, OG/Twitter tags and the route JSON-LD. Called once, from `App.tsx`.

## Canonical domain

`https://utkuacikgoz.com` (apex), set in `SITE_URL`. Everything else derives from
it. Two things to keep true outside the code:

- any other hostname that still serves this app (an old subdomain, the
  `*.vercel.app` URL) should **301 to the apex**, not serve a copy;
- the OG image at `/og-image.png` must stay 2400x1260.

## Checks worth running after a change

```bash
npm run build
grep -o '<title[^>]*>[^<]*' dist/p/bilira/index.html   # route title landed
grep -o '<meta data-seo="robots"[^>]*>' dist/index.html # noindex still on
```

Then, after deploy: the LinkedIn Post Inspector / X card validator on one
case-study URL. Search Console only becomes relevant if `INDEXABLE` is flipped.
