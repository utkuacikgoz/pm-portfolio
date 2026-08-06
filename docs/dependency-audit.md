# Dependency and delivery audit

Snapshot: 2026-08-07. Re-run the commands under "How to redo this" to refresh it.

## Where it stands

| Area | State |
| --- | --- |
| Production dependencies | 0 advisories |
| Dev dependencies | 1 high, dev-only, no fix available (js-yaml via eslint) |
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

### js-yaml (1 high, dev-only)

Reaches us as `eslint > @eslint/eslintrc > js-yaml@4.3.0`. The advisory says the
fix was not backported below v5, and forcing v5 under eslintrc risks breaking
lint for a quadratic-CPU issue that only bites when parsing hostile YAML, which
here means our own config. Wait for eslint to move.

### Vite 7 and @vitejs/plugin-react 5

Unchanged policy from CLAUDE.md: 8 and 6 target the unreleased rolldown build.

## Still worth doing

Ordered by value per unit of effort.

1. **Self-host the fonts.** `index.html` pulls Plus Jakarta Sans from
   `fonts.googleapis.com`, which costs two extra connections on a render
   blocking path and hands a third party every visitor's IP. Serving a subset
   woff2 from `/public` removes both. Needs a visual check that the fallback
   metrics do not shift the hero.
2. **Decide on `@vercel/analytics`.** PostHog now covers pageviews, funnels and
   web vitals. The Vercel script is a second analytics vendor on every page for
   a dashboard that may go unread. Removing it drops a dependency and a request.
3. **Content-Security-Policy.** The remaining header. Non-trivial here: inline
   styles need `'unsafe-inline'` in `style-src`, and PostHog's recorder needs
   `blob:` worker support. Ship it `Content-Security-Policy-Report-Only` first
   and read the violations before enforcing.
4. **Trim the three.js chunk.** 1 MB raw / 305 kB gzip, already lazy so only the
   world path pays. If it needs to come down, drei is the place to look before
   three itself.
5. **CI hardening.** Pin actions to commit SHAs (`sha_pinning_required` is off)
   and add a `concurrency` block so superseded PR runs cancel.

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
