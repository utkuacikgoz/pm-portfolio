# Dependency and delivery audit

Snapshot: 2026-08-22. Re-run the commands under "How to redo this" to refresh it.

## Where it stands

| Area | State |
| --- | --- |
| Production dependencies | 0 advisories |
| Dev dependencies | 0 advisories |
| Outdated majors | 4, every one deliberately held, reasons below |
| Static asset caching | fixed here (was re-downloading the bundle on every visit) |
| Security headers | fixed here (only HSTS was present) |

## What this pass changed

### jsdom 29 to 30, Node floor to 22.22

jsdom 29 pulled `undici@7`, which carried **five** advisories (2 high). jsdom 30
pulls `undici@8` and clears all of them. The catch is that jsdom 30 declares
`node: ^22.22.2 || ^24.15.0 || >=26`, which is why Dependabot's PR #50 failed:
CI ran Node 20 and the worker died with
`webidl.util.markAsUncloneable is not a function`.

So `engines.node` is now `^22.22.2 || >=24.15.0` and CI runs `22.x`.
**Local work needs Node 22 from now on:** `nvm use 22`. Node 20.19.6 no longer
satisfies the floor.

### postcss pinned forward via overrides

Two advisories (1 high) reached us through `vite > postcss@8.5.19`. Vite has not
released with the patched postcss yet, so `overrides.postcss = "^8.5.26"` pulls
it forward. Done as an override rather than a direct devDependency so knip does
not flag a dependency nothing imports. Remove it once Vite ships 8.5.26+.

### Assets are cacheable now

Hashed bundles were served `cache-control: public, max-age=0, must-revalidate`,
so every visit re-validated and re-fetched roughly 1.4 MB of JS, the 1 MB
three.js chunk included. `vercel.json` now sets
`public, max-age=31536000, immutable` on `/assets/*`, which is safe precisely
because Vite fingerprints those filenames.

This was the single largest delivery problem found, and it was not a dependency
issue at all.

### Security headers

Only `strict-transport-security` was present (a Vercel default). Added
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY` and a
`Permissions-Policy` denying camera, microphone, geolocation, payment and usb.

### Routine bumps

`@react-three/drei` 10.7.8, `posthog-js` 1.413.3.

## What the 2026-08-19 pass changed

### The one advisory that actually shipped is gone

`posthog-js` 1.413.3 carried `dompurify@3.4.12` (moderate). It was the only
advisory in the production tree, so it was the only one a visitor could ever
have been exposed to. `posthog-js` 1.418.1 clears it. Same major, no API change.

Cost of the bump: the posthog chunk goes 240 KB to 253 KB raw (79.7 to 84.1 kB
gzip). It is lazy, idle-loaded and gated on a project token, so it stays off the
critical path either way.

### js-yaml resolved itself

The previous pass recorded this as "the fix was not backported below v5" and
held it. That is no longer true: `js-yaml@4.3.1` is patched, and a plain
`npm install` picks it up through `@eslint/eslintrc`. No override needed, and
the note holding it has been removed.

An override forcing `js-yaml@^5` was tried and reverted. It cleared the audit,
but only because flat config never loads js-yaml at all, so it bought a green
number and left a major-version trap for whoever next touches eslint.

### nanoid pinned forward via overrides

`vite > postcss > nanoid@3.3.17` (high). Same situation as the postcss override
above and handled the same way: `overrides.nanoid = "^3.3.18"`, a patch bump
inside the same major. Remove it once Vite ships with a patched nanoid.

### The audit allowlist is empty again

`scripts/check-audit.mjs` still excused `GHSA-qwww-vcr4-c8h2` (react-router RSC
CSRF) long after react-router stopped being a dependency. Routing is now
`src/router.tsx`, hand-rolled over `history.pushState`. An allowlist entry that
outlives its package turns the CI gate into a rubber stamp, so it is gone and
the list is empty.

### Routine bumps

`@testing-library/jest-dom` 7.0.1, `@vitest/coverage-v8` 4.1.11,
`eslint-plugin-react-refresh` 0.5.4, `globals` 17.11.0, `typescript-eslint`
8.67.0, `vitest` 4.1.11. All same-major.

## What is deliberately held back, and why

### eslint-plugin-react-hooks 7

v7 enables the React Compiler rules. They produce **22 errors** here, and nearly
all are correct code:

- `immutability` and `refs` fire on `scene.fog` mutation and ref writes inside
  `useFrame`. That is how react-three-fiber is meant to be written.
- `set-state-in-effect` fires on state resets keyed to a route change
  (`ProjectPanel` resetting to beat 0 on `project.id`).
- `refs` fires on the latest-ref pattern in `useKeySequence`.

Adopting v7 means refactoring the 3D layer, which needs a browser to verify.
v5 still provides the rules that catch real bugs (rules-of-hooks,
exhaustive-deps). Pinned in `eslint.config.js`, ignored in `dependabot.yml`.

### TypeScript 7

**`tsc --noEmit` passes with zero errors under TS 7.0.2**, so the codebase is
ready. The blocker is external: `typescript-eslint` refuses to run against the
TS 7 API and `npm run lint` dies with
"typescript-eslint does not support TS 7.0"
(tracking: typescript-eslint#10940). Revisit when that ships.

### @dicebear/core 10

`@dicebear/pixel-art` has no v10 and pins `@dicebear/core@^9`, so a core major
cannot resolve. Dependabot PR #52 fails `npm ci` with ERESOLVE and should be
closed, not merged. Both packages are dev-only, used by `npm run gen:avatars`
to produce checked-in SVGs.

### Vite 7 and @vitejs/plugin-react 5

Unchanged policy from CLAUDE.md: 8 and 6 target the unreleased rolldown build.

## Still worth doing

Ordered by value per unit of effort.

1. ~~**Self-host the fonts.**~~ **Done.** `public/fonts/*.woff2` are served from
   the same origin, preloaded in `index.html` and cached immutable. Nothing on
   the critical path reaches `fonts.googleapis.com` any more.
2. **Decide on `@vercel/analytics`.** PostHog now covers pageviews, funnels and
   web vitals. The Vercel script is a second analytics vendor on every page for
   a dashboard that may go unread. Removing it drops a dependency and a request.
3. ~~**Content-Security-Policy.**~~ **Shipped report-only 2026-08-20.**
   `vercel.json` now sends `Content-Security-Policy-Report-Only` with
   `'unsafe-inline'` in `style-src` (React writes inline style attributes),
   `worker-src 'self' blob:` for PostHog's recorder, `va.vercel-scripts.com` in
   `script-src`, and the PostHog hosts in `connect-src` in case the `/ingest`
   proxy is bypassed. Report-only enforces nothing, so it cannot break the site.

   **Updated 2026-08-22.** A security review checked the policy against the built
   output rather than by loading pages: **zero** `eval(` and `new Function` across
   all shipped chunks (so no `'unsafe-eval'` is needed), every script is
   same-origin (`/assets/*`, `/_vercel/insights/script.js`,
   `/ingest/static/recorder.js`), the built CSS references only the self-hosted
   woff2, and no off-origin images exist in `src/`. The policy as written is
   already compatible.

   The blocker is that **report-only with no `report-uri` or `report-to` collects
   nothing**: violations land only in each visitor's own console, so the trial can
   never conclude. Either wire a collector or just rename the header. Known
   casualty of enforcing: PostHog's `?__posthog` debug toolbar loads from
   `us.posthog.com`, which is not in `script-src`. That is Utku-only.
4. ~~**Trim the three.js chunk.** 1 MB raw / 305 kB gzip, already lazy so only the
   world path pays. If it needs to come down, drei is the place to look before
   three itself.~~ **Both halves of this were wrong.** It was not lazy (see
   `docs/performance.md`), and drei is 0.6% of that chunk, not the place to look.
   Fixed and corrected.
5. ~~**CI hardening.**~~ **Done.** `.github/workflows/ci.yml` pins every action to
   a commit SHA, pins gitleaks by version *and* verifies a SHA256 checksum before
   a privileged install, sets `permissions: contents: read`, and has a
   `concurrency` block so superseded PR runs cancel.

## Security headers

`vercel.json` sends HSTS (with `includeSubDomains`), `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and the report-only CSP
above on every response.

**`X-Robots-Tag: noindex, nofollow` on `/(.*\.pdf)`** is the one that is easy to
miss. `INDEXABLE = false` works through `<meta name="robots">`, which a PDF cannot
carry, and `robots.txt` deliberately allows crawling so the meta can be read (see
`docs/seo.md`). Without the header the CV was crawlable and indexable by name
while every HTML route asked not to be. Any future non-HTML asset that should stay
out of search needs the same treatment.

## How to redo this

```bash
nvm use 22
npm outdated
npm audit                 # everything
npm audit --omit=dev      # what actually ships; this is the gate CI enforces
node scripts/check-audit.mjs
npm ls <package>          # trace who pulls a vulnerable transitive
curl -sI https://www.utkuacikgoz.com/assets/<hashed>.js | grep -i cache-control
curl -sI https://www.utkuacikgoz.com/ | grep -iE 'strict-transport|x-content-type|referrer-policy|x-frame'
```
