# CLAUDE.md — pm-portfolio

Guidance for any future Claude session working in this repo. Read this first.

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
- **Token-efficient**: minimize Claude's own tokens (his standing preference). Don't
  spawn subagents unless he asks. Don't over-explain; lead with the answer.
- Audience for the product = recruiters/hiring managers who may hate puzzles and want
  the goods in <30s. Every feature is judged against that.

## Locked product decisions (don't relitigate without reason)
- **On-rails diorama**, NOT a free-roam walkable world.
- **Stylized low-poly / flat-shaded** (subtle voxel nod), NOT literal Minecraft —
  protects senior-credibility brand. Neon-on-black palette (see below).
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

## Content model
`src/content/*.ts` (one per project) → typed by `src/content/types.ts` (`CaseStudy`,
`Beat`, `Metric`, `Decision`, `Initiative`, `Stakeholder`). Beats follow the canonical
arc: **Problem → Constraints → Approach → Results → Learnings**. Keep copy verbatim —
the quantified outcomes are the gold.

## Stack / conventions
- **React 19 + Vite 6 + @react-three/fiber 9 + drei 10 + three 0.184 + react-router 7 +
  TS 6.** TS **strict** + `verbatimModuleSyntax` → **use `import type` for type-only
  imports** (this bites otherwise).
- **Toolchain pin:** machine is on **Node 22.11** (<22.12), so `@vitejs/plugin-react` is
  held at **v4** and Vite at **6** (plugin-react 5/6 + Vite 7 require Node ≥22.12, and
  import `vite/internal` which Vite 6 lacks). Bump Node to ≥22.12 to unlock Vite 7.
- **Lighting is physically-based** (r3f v9): light intensities are intentionally large
  (point light ~240 with inverse-square decay; ambient/hemisphere carry base visibility).
  Don't "fix" them down to old 0.5–2 values or the scene goes black.
- Styling: **inline styles**, neon-on-black. Palette: `#FF0080` magenta, `#00FFFF` cyan,
  `#FFD700` gold, `#FF6B35` orange, `#00FF88`/`#00FF00` green. Font: Plus Jakarta Sans,
  headings weight 900.
- `src/global.d.ts` has a permissive JSX intrinsic shim so r3f elements type-check —
  leave it.
- `npm run build` runs **vite only (no tsc)** — type-check separately with
  `npx tsc --noEmit -p tsconfig.app.json` before claiming type-clean.

## Commands
- Dev: `npm run dev` (Vite, :5173) · Build: `npm run build` · Types: `npx tsc --noEmit -p tsconfig.app.json`
- Repo lives at `~/Desktop/projects/pm-portfolio-main/pm-portfolio` (git-backed, Vercel).
  Stale duplicates exist elsewhere on disk — ignore them.

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
