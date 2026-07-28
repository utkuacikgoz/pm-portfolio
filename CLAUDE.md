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
- **Palette:** the **entrance (character-select + hero) stays neon-on-black**; the
  **world itself is tropical dusk** (teal/indigo CSS sky behind a transparent canvas,
  warm low sun, turquoise water). Neon accents throughout.
- **Sound is ON by default** (synth waterfall bed + SFX, `armAudio` starts it on the
  first gesture); persisted mute toggle.
- **Character-select gate** (`AvatarSelect`: HR / Hiring Manager / Stalker) is **fun
  label only** — cosmetic badge, no copy/story branching.
- **No dashes in visible copy, ever** (house style): no em/en dashes or minus signs in
  any rendered string; plain-Latin ("resume", not the accented spelling). Comments are
  exempt. Metric ranges read as "X to Y".
- **Biomes now (visible):** BiLira, Mestores, Apollo, La3eb, Upshift (employment,
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
- `src/state/useExperienceMode.ts` — returns `'world' | 'flat'`. Flat when small
  screen / reduced-motion / no-WebGL. `<World>` is lazy so the **flat path never
  downloads the ~265 KB three chunk**.
- `src/pages/WorldExperience.tsx` — composer: owns active index + panel state, keyboard
  travel, renders World OR FlatMap, mounts overlays. (Shared state lives here, passed by
  props across the lazy boundary — intentionally no context.)
- `src/ui/ProjectPanel.tsx` — DOM drawer with narrative beats + SVG viz. Shared by world
  and flat → content parity for free. Focus-trapped, Esc to close.
- `src/ui/viz/index.tsx` — PM charts (metrics, decision matrix, effort/impact,
  stakeholders) as **SVG, not WebGL** (no extra GL contexts; accessible).
- `src/ui/WorldNav.tsx` — sr-only keyboard/screen-reader path (Tab travels, Enter opens).
- `src/ui/EscapeHatch.tsx` + `src/pages/Resume.tsx` — persistent "skip to résumé".
- Routing (`react-router-dom`): `/`, `/p/:id` (deep-linkable), `/resume`. URL is the
  source of truth for the open panel.

## Content truth (IMPORTANT)
The real CV is the source of truth (Senior PM, 8+ yrs; roles: **BiLira, Upshift, Lean
Scale, Technolera**). The portfolio's `apollo / la3eb / mestores / mona` are NOT separate
CV roles — likely Lean Scale/Technolera client work or embellished — and several studies
had numbers **bolder than the CV** (e.g. BiLira "92%" vs CV "35%"). The CV is linked from
the site, so inconsistencies are a credibility risk. **All 5 visible studies are now
voice-rewritten with insight callouts. BiLira uses CV-accurate numbers; the other 4 KEEP
their original (bolder-than-CV) numbers — the user explicitly said "do not touch" the
facts. Mona (hidden) is still original AI-ish copy.** Real BiLira facts:
100K+ users, 150+ assets, 5+ chains, 25-person team, −35% review time, 99.7% accuracy,
−40% false positives, Chainalysis/Notabene, OTC 500→275ms / +45%, Trade API 50M calls/mo /
99.9% uptime, releases quarterly→bi-weekly, 0 breaches.

Indie products (shown as light "glimpse" panels, `published:true`, no full case study):
**Buyback Signal** (trading-signal bot), **PassATS**, **Cofoundr** (co-founder matching).

## Content model
`src/content/*.ts` (one per project) → typed by `src/content/types.ts` (`CaseStudy`,
`Beat`, `Metric`, `Decision`, `Initiative`, `Stakeholder`). Beats follow the canonical
arc: **Problem → Constraints → Approach → Results → Learnings**. Keep copy verbatim —
the quantified outcomes are the gold.

## Stack / conventions
- **React 19 + Vite 7 + @vitejs/plugin-react 5 + @react-three/fiber 9 + drei 10 +
  three 0.184 + react-router 7 + TS 6.** TS **strict** + `verbatimModuleSyntax` → **use
  `import type` for type-only imports** (this bites otherwise).
- **Node ≥20.19 required** (Vite 7). The machine's default `node` is **22.11**, which is
  BELOW the floor — local `npm run build`/`dev` must use a compatible Node:
  `source ~/.nvm/nvm.sh && nvm use 20.19.6` (installed) before building. Vercel honors
  `engines` and builds fine. NOTE `@vitejs/plugin-react` is pinned to **5**, not 6 —
  plugin-react 6 targets the unreleased Vite 8 (rolldown) and imports `vite/internal`.
- **Lighting is physically-based** (r3f v9): light intensities are intentionally large
  (point light ~240 with inverse-square decay; ambient/hemisphere carry base visibility).
  Don't "fix" them down to old 0.5–2 values or the scene goes black.
- Styling: **inline styles**, neon accents (black entrance, tropical-dusk world; see Locked
  decisions). Palette: `#FF0080` magenta, `#00FFFF` cyan,
  `#FFD700` gold, `#FF6B35` orange, `#00FF88`/`#00FF00` green. Font: Plus Jakarta Sans,
  headings weight 900.
- `src/global.d.ts` has a permissive JSX intrinsic shim so r3f elements type-check —
  leave it.
- `npm run build` runs **vite only (no tsc)** — type-check separately with
  `npx tsc --noEmit -p tsconfig.app.json` before claiming type-clean.

## Commands
- Dev: `npm run dev` (Vite, :5173) · Build: `npm run build` · Types: `npx tsc --noEmit -p tsconfig.app.json`
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
2. **Verify (always, with Node 20.19):** `source ~/.nvm/nvm.sh && nvm use 20.19.6` then
   `npx tsc --noEmit -p tsconfig.app.json` (must be 0) **and** `npm run build` (vite-only, so
   tsc is separate). Never ship without both green.
3. **Branch off main** (never commit straight to main), commit with a clear message,
   `git push -u origin <branch>`. **No Co-Authored-By / Claude trailer** on commits.
4. **PR:** `gh pr create` with a real summary. **No "Generated with Claude" / Claude
   co-author** on PRs (Utku's standing preference).
5. **Merge:** `gh pr merge --squash --delete-branch` (admin-merge if checks aren't required).
6. **Deploy:** merging to `main` auto-deploys prod via the Vercel↔GitHub integration — confirm
   it kicked off; don't run `vercel --prod` locally (repo isn't `.vercel`-linked, would go
   interactive). I have no browser, so visual/interaction QA still has to be eyeballed on the
   resulting prod/preview URL.

## Status & next steps (as of 2026-06-07)
- **Done (Increment 1):** full architecture + all 5 employment islands navigable; BiLira
  fully fleshed; content bug in `bilira.ts` (mis-nested `metrics`) fixed.
- **Done (quick-win batch):** `vercel.json` SPA rewrite (deep links no longer 404 in
  prod); `index.html` real title + OG/Twitter meta; WebGL probe cached in
  `useExperienceMode`; `npm audit fix` (high rollup + postcss cleared; 2 dev-only Vite/
  esbuild moderates remain, need breaking Vite 6).
- **Done (dead-code cleanup):** deleted the orphaned old portfolio — `pages/LandingPage`,
  `pages/CaseStudyPage`, all of `src/components/*`, `content/useCaseStudy`, the
  `*-with-viz`/`bilira-enhanced` drafts, `cases.json`, `assets/react.svg`,
  `public/vite.svg`, empty `App.css`. Whole repo now type-checks clean (`tsc` 0 errors).
- **Done (dep upgrade + Increment 2):** upgraded to React 19 / r3f 9 / drei 10 / three
  0.184 / router 7 / Vite 6 / TS 6 (0 vulns); retuned lighting for PBR; spline-rail camera
  with weaving island path + idle drift; richer per-domain structures + foliage. Staging on
  branch `voxel-world`.
- **Known gaps / TODO (see audits):**
  - No résumé PDF, no analytics, thin "about/positioning", no social proof — business gaps.
  - Real 1200×630 PNG OG image (currently the SVG logo, renders inconsistently on socials).
  - Indie products (PassATS, Stats XI) still hidden — flip `published` + add content when ready.
  - Visual tuning of lighting/structures is unverified by Claude (no browser) — eyeball on staging.
