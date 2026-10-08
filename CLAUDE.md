# CLAUDE.md — pm-portfolio

Guidance for any future Claude session working in this repo. Read this first.

<!-- caveman-mode: keep this block in sync across repos -->
## Caveman mode

Default to caveman. Short. No filler.

- No preamble, no recap, no "I'll now…". Lead with the answer.
- Status is fragments, not sentences: "Bug found." "Fix. Test." "Done."
- No closing summary unless asked. Never restate the diff in bullets.
- Tradeoffs, pushback, and explanations: plain English, still short. Not caveman —
  clarity wins there.
- Terse ≠ skipping work. Required gates (tests, lint, type-check, CI, deploy checks)
  still run and still get reported — just briefly.
- Code, comments, commit messages, and PR bodies are unaffected. Caveman is chat only.

## What this is
Utku Acikgoz's personal portfolio, being reworked from a generic Three.js
dev-portfolio into a **stylized low-poly "career world"**: an on-rails diorama
where each island = a project, with the narrative + metrics in a fast DOM overlay.

**Two jobs (in priority order):**
1. Top-of-funnel **trust signal for senior PM roles** — must be recruiter-skimmable.
2. Funnel for Utku's **own indie products** (PassATS, Stats XI) — *added later*,
   architecture must already support them.

## Who Utku is / how to work with him
- Senior PM, 8+ yrs (fintech, blockchain, HRtech, SaaS), 11 products shipped.
  Moving toward indie / autonomous-income products.
- He thinks in **product + business terms**, not just code. Frame tradeoffs that way.
- **Be blunt. Push back** when something is the wrong call — he explicitly asks for it.
  Story first, tech second.
- **Token-efficient** — see "Caveman mode" above. Don't spawn subagents unless he asks.
- Audience for the product = recruiters/hiring managers who may hate puzzles and want
  the goods in <30s. Every feature is judged against that.

## Locked product decisions (don't relitigate without reason)
- **On-rails diorama** is the spine, NOT a free-roam walkable world. Exception: an
  optional **free surf mode** (`SurfController`) lets you hop on a board and roam the
  ocean with WASD/arrows; it's a bonus, the rails remain the default path.
- **Stylized low-poly / flat-shaded** (subtle voxel nod), NOT literal Minecraft.
- **Palette:** use the **taupe + forest/coral/mauve/blue** system in `src/theme.ts` and
  `docs/design-system.md`. Main accents: forest `#2C4832`, coral `#D76F53`, mauve
  `#C57EC2`, blue `#6273BF`; project green is seafoam `#80B192` for accessible contrast.
  UI surfaces are taupe ink `#1D1816` / raised ink `#2B2422` / surface `#473C39` / border
  `#5B4F4B`, with text `#FBFAF9`. The hero stays dark with coral/ocean glow; the world is
  forest → taupe → coral dusk with an amber sun and ocean-blue water. `theme.ts` `T` owns
  the atmosphere and components must use its tokens rather than add ad hoc hex values.
- **No sound controls or synthesized audio.** They were removed to keep the world
  interface focused on navigation and project discovery.
- **Entrance flow:** static hero first (no Canvas mounted) → Enter → character-select →
  camera dive. The 3D world (and three.js) mounts only on entering or a deep link.
- **Character-select gate** (`AvatarSelect`: HR / Hiring Manager / Stalker) is **fun
  label only** — cosmetic, no copy/story branching. Persisted in **sessionStorage**
  (not localStorage), so it re-asks every fresh launch; a same-tab refresh keeps the pick.
- **No dashes in visible copy, ever** (house style): no em/en dashes or minus signs in
  any rendered string; plain-Latin ("resume", not the accented spelling). Comments are
  exempt. Metric ranges read as "X to Y". Guarded by
  `src/content/house-style.test.ts`, which walks every case study, registry row,
  contact detail and SEO route and names the offending path.
- - **No "product principles" in the ocean.** Four gates used to pop a maxim as
  you surfed through them. They are gone and should not come back: two of the
  four titles were borrowed (one is an Amazon leadership principle verbatim),
  all four asserted things the rest of the site proves with numbers, and every
  break now carries a real project with a real metric, which is the same job
  done properly.

**Biomes now (visible):** BiLira, Mestores, Apollo, La3eb, Upshift (employment,
  strongest-signal first). **Hidden, ready to flip:** PassATS, Stats XI, Mona — set
  `published: true` in the registry to surface.

## Architecture (the important part)
Single source of truth → single Canvas → one draw path.

- `src/projects/projects.ts` — **the registry**. One row per project
  (`published`, `kind`, `accent`, `structure`, `content`). The world, flat map, and
  résumé all map over `PUBLISHED_PROJECTS`. **Adding an indie product = add a content
  file + a registry row + flip `published`.** This is the extensibility contract.
- `src/world/World.tsx` — the entire 3D scene in **ONE `<Canvas>` / one WebGLRenderer**.
  Every cube across every island is **one drei `<Instances>`** (per-instance color) →
  no per-cube draw calls. Lazy-loaded so three.js only ships on the world path.
- `src/world/geometry.ts` — pure builder: floating islands + per-domain structures.
  Procedural (no GLTF/asset downloads).
- `src/world/CameraRig.tsx` — on-rails camera, damped lerp, **reused vectors (no
  per-frame allocation)**. (The old code allocated a `THREE.Group` every frame — don't.)
- `src/world/surf-controls.ts` — **pure handling + camera curves for free surf**, all
  expressed against `paceRatio(speed)` and unit-tested. Steering bite, slip/drift,
  lean, chase distance/height/aim/FOV/spring and wake/spray cadence live here, NOT
  inline in the frame loop. The tested invariant that matters: the chase camera's
  downward pitch must stay inside its vertical half-FOV at every speed, or the
  horizon leaves the frame and the ocean reads as a flat teal plane.
- `src/world/geometry.ts` `seaHeight` / `seaSlopeX` / `seaSlopeZ` — the wave field and
  its exact analytic gradient. **All three mirror the Water vertex shader in
  `Ocean.tsx` and must be changed together** (a test compares the slopes against a
  numeric derivative).
- `src/world/layout.ts` — `EMP_COUNT` / `WATER_Y` / `INDIE_INDEX`, the only
  layout facts the DOM shell needs. It exists so importing one constant does not
  drag the procedural builders in `geometry.ts` into the entry chunk, which is
  exactly what used to happen. **The DOM shell (`src/pages`, `src/ui`) must not
  take a VALUE import from a world module that builds anything** — type imports
  are free, and the surf HUD's totals are reported by the world through
  `onTotals` rather than imported. `docs/performance.md` carries the one-line
  grep that catches a regression.
- `src/state/useExperienceMode.ts` — returns `'world' | 'flat'`. Flat when small
  screen / reduced-motion / no-WebGL. `<World>` is lazy so the **flat path never
  downloads the three chunk** — true again as of 2026-08-07, after a `manualChunks`
  bug had been welding that chunk to the entry for every visitor. Guard it: see
  the verification note in `vite.config.ts` and `docs/performance.md`.
- `src/pages/WorldExperience.tsx` — composer: owns active index + panel state, keyboard
  travel, renders World OR FlatMap, mounts overlays. (Shared state lives here, passed by
  props across the lazy boundary — intentionally no context.)
- `src/ui/ProjectPanel.tsx` — DOM drawer with narrative beats + SVG viz. Shared by world
  and flat → content parity for free. Focus-trapped, Esc to close.
- `src/ui/viz/index.tsx` — PM charts (metrics, decision matrix, effort/impact,
  stakeholders) as **SVG, not WebGL** (no extra GL contexts; accessible).
- `src/ui/WorldNav.tsx` — sr-only keyboard/screen-reader path (Tab travels, Enter opens).
- `src/ui/EscapeHatch.tsx` + `src/pages/Resume.tsx` — persistent "skip to résumé".
- Routing (`src/router.tsx`, hand-rolled over history.pushState, no router dependency):
  `/`, `/p/:id` (deep-linkable), `/resume`. URL is the source
  of truth for the open panel.
- `src/seo/routes.ts` — title/description/JSON-LD/no-JS summary per route, **derived from
  the project registry**. `scripts/vite-seo.ts` (Vite plugin) prerenders one static HTML
  file per route plus `sitemap.xml` + `robots.txt` at build; `src/seo/useSeo.ts` keeps the
  head correct on client-side navigation. Canonical domain is the apex
  `https://utkuacikgoz.com`. See `docs/seo.md`.
- `src/analytics/*` — PostHog provider (masked session replay, `/ingest` first-party
  proxy), named funnel events (`events.ts`), and first/last-touch UTM attribution
  (`attribution.ts`) registered as super properties. See `docs/analytics.md`;
  `npm run utm -- --list` prints the tagged links to paste per channel.

## Content truth (IMPORTANT)
The real CV (`public/UtkuAcikgoz-CV.pdf`) is the source of truth. It lists **four
employers**: BiLira (Senior PM, 2025 to present), Upshift (Senior PM, 2022 to
2025), Lean Scale (PM, 2020 to 2022), Technolera (Product Owner, 2018 to 2020).

**Resolved 2026-08-10.** The world shows five islands, and three of them
(Mestores, Apollo, La3eb) are **client engagements delivered during Lean Scale**,
confirmed by Utku. They are not separate jobs. Every published project now
carries `role` / `org` / `period` (+ `clientWork`) in the registry, rendered by
`attributionLine()` on the panel, the resume, the flat map and the crawlable
summaries, and a test asserts every project maps to an employer that exists on
the CV. Do not add a project without one. The hero says "five products shipped",
not "career stops", for the same reason.

**Upshift's numbers are real**, per Utku: the site's churn 8% to 4%, $30M ARR and
$5M contracts are accurate, the CV bullets simply chose the HR-ops and RevOps
story instead (NPS 32 to 50, hiring cycle 45 to 34 days, ROI +22%). The two
documents describe the same job from different angles rather than disagreeing.
Worth adding a churn bullet to the CV so they corroborate each other; until then
the site is the only place that story appears.

**BiLira vs the CV (CV replaced 2026-10-06).** The current CV still states 35%
review time, 40% fewer false positives, +45% throughput, 500+ OTC trades/week
over 15+ pairs, 50M+ calls/month, 99.9% uptime, quarterly to biweekly, a
25-person team and Chainalysis/Notabene. It **no longer states** 99.7%
accuracy, 500ms to 275ms latency, 0 breaches, 100K+ users, 150+ assets or 5+
chains, all of which the site's BiLira case study (and the hero's "100K+ users
reached") still use. Utku confirmed those as real earlier; they are simply not
on the CV now, so the site claims more than the CV backs. The previous CV,
which carried all of them, is in git history.

Indie products (shown as light "glimpse" panels, no full case study). They are
`published: false`, which keeps them off the main rail; `INDIE_PROJECTS` selects
them by `kind: "indie"` plus a `glimpse` line, so they still reach the resume
shelf and the ocean island:
**PassATS** (resume checker), **Psst** (tap-a-friend iPhone app), **Rack Rate**
(AI coding cost comparison), **Little Menace** (gremlin pet iPhone app), all
live, then **Buyback Signal** (trading-signal bot), in development. Cofoundr
was dropped 2026-10-06. The indie panel's "Live now: ..." sentence is derived
by `indieStatusLine()` from the registry, so shipping one is a `url` and nothing
else.

**Live:** PassATS at https://passats.pro (2026-08-30); Psst at
https://www.psstapp.fun (App Store listing) and Rack Rate at
https://rack-rate-flax.vercel.app (both 2026-10-06); Little Menace at
https://www.littlemenace.fun (App Store listing, 2026-10-08). A `url` on the registry
row is what makes an indie product live: `isLive()` reads it, the shelf links
out and says "LIVE", and a row without one says "IN DEVELOPMENT". Everything
on the shelf used to claim to be forthcoming whether or not it existed, which
costs the exact credibility the shelf is there to earn. `published` stays
`false`: that flag puts a project on the career rail among the employment case
studies, which needs a content file and a CV employer, and an indie product has
neither. Live and published are different questions.

## Content model
`src/content/*.ts` (one per project) → typed by `src/content/types.ts` (`CaseStudy`,
`Beat`, `Metric`, `Decision`, `Initiative`, `Stakeholder`). Beats follow the canonical
arc: **Problem → Constraints → Approach → Results → Learnings**. Keep copy verbatim —
the quantified outcomes are the gold.

## Stack / conventions
- **React 19 + Vite 7 + @vitejs/plugin-react 5 + @react-three/fiber 9 + drei 10 +
  three 0.185 + TS 6.** TS **strict** + `verbatimModuleSyntax` → **use
  `import type` for type-only imports** (this bites otherwise).
- **Node ≥22.22.2 required** (jsdom 30 sets the floor; Vite 7 is fine above it).
  The machine's default `node` is **22.11**, which is BELOW the floor — local
  `npm run build`/`dev`/`test` must use a compatible Node:
  `source ~/.nvm/nvm.sh && nvm use 22` (22.23.2 installed) before building. Vercel honors
  `engines` and builds fine. NOTE `@vitejs/plugin-react` is pinned to **5**, not 6 —
  plugin-react 6 targets the unreleased Vite 8 (rolldown) and imports `vite/internal`.
- **Lighting is physically-based** (r3f v9): light intensities are intentionally large
  (point light ~240 with inverse-square decay; ambient/hemisphere carry base visibility).
  Don't "fix" them down to old 0.5–2 values or the scene goes black.
- Styling: **inline styles**, palette tokens from `src/theme.ts` `T`; see
  `docs/design-system.md` for approved values and roles. Font: Plus Jakarta Sans, headings
  weight 900.
- **No JSX intrinsic shim is needed.** A permissive one used to live in
  src/global.d.ts (deleted in `6f339c5`); r3f 9 ships its own JSX types and `tsc`
  is clean without it. This bullet told sessions to "leave it" for months after
  the file was gone, which is why `src/docs-integrity.test.ts` now exists.
  **Backticks around a path mean it is live** — that test asserts it. Write a
  removed path as plain text, as above.
- `npm run build` runs **vite only (no tsc)** — type-check separately with
  `npx tsc --noEmit -p tsconfig.app.json` before claiming type-clean.

## Commands
- Dev: `npm run dev` (Vite, :5173) · Build: `npm run build` · Types: `npx tsc --noEmit -p tsconfig.app.json`
- Dependency + delivery posture (held-back majors, why): `docs/dependency-audit.md`
- Repo lives at `~/repos/pm-portfolio` (git-backed, Vercel). Stale duplicates exist
  elsewhere on disk — notably `~/Desktop/projects/pm-portfolio-main/pm-portfolio`, which
  is months behind. Ignore them.

## Shipping workflow (the standing default — do this without being re-asked)
When work is done and Utku says "ship it" (or commit / PR / merge / deploy), run the whole
chain end-to-end, no per-step hand-holding:
1. **Deps:** `npm outdated` + `npm audit`. Take **safe** same-major updates (e.g. router 7.x).
   Do **NOT** bump Vite past 7 or `@vitejs/plugin-react` past 5 (pinned — Vite 8/rolldown is
   breaking; see Stack section). The remaining 2 highs are esbuild/vite **dev-only** (never
   shipped to prod) and are accepted until the toolchain can move — don't `audit fix --force`.
2. **Verify (always, with Node 22):** `source ~/.nvm/nvm.sh && nvm use 22` then
   `npx tsc --noEmit -p tsconfig.app.json` (must be 0) **and** `npm run build` (vite-only, so
   tsc is separate). Never ship without both green.
3. **Branch off main** (never commit straight to main), commit with a clear message,
   `git push -u origin <branch>`. **No Co-Authored-By / Claude trailer** on commits.
4. **PR:** `gh pr create` with a real summary. **No "Generated with Claude" / Claude
   co-author** on PRs (Utku's standing preference).
5. **Merge:** `gh pr merge --squash --delete-branch` (admin-merge if checks aren't required).
6. **Deploy:** merging to `main` auto-deploys prod via the Vercel↔GitHub integration — confirm
   it kicked off; don't run `vercel --prod` locally (repo isn't `.vercel`-linked, would go
   interactive). Visual QA can now be driven with Playwright + Chromium (see
   `docs/performance.md`), but **feel** (motion, camera, pacing) still has to be
   eyeballed by Utku on the resulting prod/preview URL.

## Status & next steps (as of 2026-08-29)

The long "Done" log that used to live here described work from June and had gone
stale enough to mislead: it listed the CV, analytics, the OG image and the fonts
as missing months after each shipped. Git history is the record of what was done.
This section is only what is *true now* and what is *left*.

**Shipped and verified in production**
- Architecture per the section above: one Canvas, one registry, DOM overlay.
- `public/UtkuAcikgoz-CV.pdf` is live and linked from the resume.
- PostHog is live: the token is set in Vercel and baked into the deployed bundle,
  `/ingest` proxies, funnel events and UTM attribution are recorded.
- Real `og-image.jpg` (198 KB, generated from source by `scripts/gen-og.mjs`).
- Fonts are self-hosted and cached immutable; three.js and posthog are both off
  the critical path.
- The apex `https://utkuacikgoz.com` serves with its own certificate, so
  `SITE_URL` and every canonical / og:url finally resolve.
- Every route has one `<h1>` and a `<main>`, moving between the world and the
  resume moves focus, and the panel's section jumps carry real ARIA.
- **Corrected 2026-08-22, all three were listed as open long after they shipped:**
  CI actions ARE pinned to commit SHAs (with a `concurrency` block); `npm audit` is
  **0 vulnerabilities**, so the two "accepted" esbuild/vite highs are gone; and
  `www.` and `portfolio.` both 308 to the apex (verified with curl).
- `X-Robots-Tag: noindex, nofollow` on `/(.*\.pdf)`. `<meta name="robots">` cannot
  reach a PDF, so the CV was crawlable and indexable while every HTML route said
  noindex. HSTS declares `includeSubDomains` **on the app's own responses only**
  (`vercel.json`'s `/(.*)` rule). The `www.` and `portfolio.` 308s are Vercel
  domain-level redirects that never touch `vercel.json`, and still answer with a
  bare `max-age=63072000`. Verified with curl 2026-08-22.
- **Verification has a browser now.** Playwright + Chromium drive the real app; see
  `docs/performance.md`, which since 2026-08-29 actually documents it. Anything
  touching the 3D scene must run **headed**: headless Chromium renders WebGL
  through SwiftShader and reports ~7 fps for a scene that runs at 60. On a
  machine with no GPU even a headed run is llvmpipe at ~20 fps, so it verifies
  correctness and not frame rate, and **feel is not measurable there at all**.
- **Phones can surf (2026-08-29).** Small screens still get the flat map by
  default, plus one opt-in button into free surf. One-drag thumb controls live in
  `src/world/surf-touch.ts`; `aspectFov` in `src/world/surf-controls.ts` widens
  the lens in portrait, because three's `fov` is VERTICAL and portrait was
  cropping the sides down to a ~22 degree view. Not offered to reduced-motion or
  no-WebGL visitors.
- **Every break is a project (2026-08-29).** The five surf breaks carry the five
  published projects, coloured by accent, and catching a wave surfaces that
  project's headline with one tap into its case study. Derived from
  `PUBLISHED_PROJECTS`, so "add row, flip `published`" still holds.
- **Ocean visuals (2026-08-29).** Sun glitter from the wave gradient the vertex
  stage already computes, a CSS speed vignette (`src/ui/SpeedRush.tsx`), a
  carve-aware wake, and wave lips that throw past vertical
  (`src/world/wave-face.ts`) instead of standing as walls.

**Open, roughly by value**
- **A barrel you can ride.** Built 2026-08-29 and cut the same day. The wave came
  to the rider (keeping station beside a board the player still fully steers,
  rather than scripting the board onto the wave's line, which this mode
  deliberately moved away from) and the chase rig tucked in so the tube could be
  wave-sized. It renders as a wall: the chase camera is spring damped, and
  against a face seven units away the spring lags far enough through a drop-in
  that the camera crosses to the outside of it. Making it work means staging the
  ride against the wave, camera included, which is a feel-level redesign of the
  drop-in. The lip curl shipped and is the prerequisite.
- **Entry showreel, parked 2026-10-06.** "The Datum", a 15 s Canvas2D reel
  that played on the hero once per session, was built, verified and then taken
  off the site because Utku did not love it. It is intact in git history at
  commit 6b7f636 (reel module, hero wiring, tests); reverting the commit titled
  "hero: take the Datum reel off the site for now" restores it.
- **No surf share control.** The generated run card and capture pipeline were
  removed to keep the surf interface focused on finding and opening projects.
- ~~Content-Security-Policy still ships as report-only.~~ **This was false.** It
  has been enforced since `security: enforce the CSP instead of reporting it to
  nobody (#77)`; the bullet outlived the fix and was reported as open work twice
  afterwards. Re-verified 2026-08-29 by serving the built `dist` under
  `vercel.json`'s exact headers and driving it: a surf run, the share card
  (which uses `data:` and `blob:` URLs and an anchor download), a case study and
  the resume all produce **zero** violations. Known casualty, unchanged:
  PostHog's `?__posthog` debug toolbar.
- ~~The six case studies are 41.2 KB of the entry chunk~~ **Fixed, and this
  entry was wrong for a while after it was.** The registry no longer carries a
  `content` reference, so the prose lives in the lazy `ProjectPanel` chunk; a
  grep of the built output for a case-study sentence finds it there and nowhere
  else. The critical path is now 272 KB raw / 85 KB gzip. See `docs/performance.md`.
- ~~`src/router.tsx` drops `search` and `hash`.~~ **Fixed 2026-08-29**, because
  the share link bit it exactly as predicted: `navigate` pushed the full URL so
  the address bar was right, while the router's own state dropped the query on
  the first client-side move. It now tracks all three, and `src/router.test.tsx`
  pins it.
- Business gaps, needing Utku rather than code: thin about/positioning, no social
  proof. Buyback Signal still says "IN DEVELOPMENT" because it has nowhere to
  send anyone; give it a `url` when it ships. A full case study for
  PassATS (content file plus `published: true`) is a separate, larger call, and
  would put an indie product on a rail whose other five rows are employment.
- Lighting and structure tuning is checkable now (Playwright, **headed** for
  anything 3D), but nobody has done a pass. Feel still needs Utku's eyes.
