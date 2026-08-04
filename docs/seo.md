# SEO

The site is a client-rendered SPA, so search engines and (more importantly) link
unfurlers need help. Three pieces do the work.

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
dist/sitemap.xml           generated with lastmod
dist/robots.txt            generated
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
cat dist/sitemap.xml                                    # every published project
```

Then, after deploy: Google Search Console (submit the sitemap once), and the
LinkedIn Post Inspector / X card validator on one case-study URL.
