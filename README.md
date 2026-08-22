# utkuacikgoz.com

Utku Acikgoz's portfolio: a stylized low-poly **career world** you fly through, where
each island is a product he shipped. Built as an on-rails diorama with the narrative and
metrics in a fast DOM overlay, plus an optional free surf mode.

Live at **[utkuacikgoz.com](https://utkuacikgoz.com)**.

React 19 · Vite 7 · TypeScript 6 (strict) · three.js via @react-three/fiber 9 + drei 10 ·
Vitest · deployed on Vercel.

## Run it

**Node >= 22.22.2 is required** (jsdom 30 sets the floor). The usual default of 22.11 is
below it, so with nvm:

```bash
source ~/.nvm/nvm.sh && nvm use 22
npm install
npm run dev          # Vite on :5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server with HMR |
| `npm run build` | production build. **Vite only, no type-check** |
| `npm run typecheck` | `tsc --noEmit -p tsconfig.app.json`. Run it separately, the build does not |
| `npm run test:run` | Vitest, one pass |
| `npm run lint` | ESLint |
| `npm run utm -- --list` | print the tagged campaign links to paste per channel |

`npm run build` deliberately does not type-check, so **typecheck and build are two
separate gates**. Green build is not green types.

## How it fits together

One registry, one `<Canvas>`, one draw path.

- **`src/projects/projects.ts`** is the single source of truth. One row per project. The
  world, the flat map and the resume all map over it. Adding a product = add a content
  file + a registry row + flip `published`. That is the whole extensibility contract.
- **`src/world/`** holds the 3D scene: every cube across every island is one instanced
  mesh, and three.js is lazy-loaded so the flat fallback never downloads it.
- **`src/ui/`** holds the DOM overlay, including the case-study drawer and the SVG
  charts (charts are SVG, not WebGL, so they stay accessible and add no GL contexts).
- Small screens, reduced-motion and no-WebGL get a fast flat map instead of the world.

**`CLAUDE.md` is the deep guide**: architecture, locked product decisions, content truth,
house style and the shipping workflow. Read it before changing anything structural.

## Docs

| Doc | What is in it |
| --- | --- |
| [`docs/performance.md`](docs/performance.md) | bundle and runtime budget, the hero animation invariant, how to measure |
| [`docs/analytics.md`](docs/analytics.md) | PostHog behind a first-party `/ingest` proxy, funnel events, UTM attribution |
| [`docs/seo.md`](docs/seo.md) | per-route metadata derived from the registry, build-time prerendering |
| [`docs/dependency-audit.md`](docs/dependency-audit.md) | held-back majors and why, audit posture, security headers |
| [`docs/design-system.md`](docs/design-system.md) | palette and type scale, both guarded by tests |
| [`docs/case-study-visuals.md`](docs/case-study-visuals.md) | how to add metrics, decisions, initiatives and stakeholders to a case study |
| [`docs/posthog-setup.md`](docs/posthog-setup.md) | one-time PostHog project setup |

## Environment

Set `VITE_POSTHOG_PROJECT_TOKEN` in Vercel to turn analytics on. Copy `.env.example` to
`.env.local` for local testing. Without the token the site runs normally and sends
nothing.

## Deploying

Merging to `main` auto-deploys production through the Vercel integration. Do not run
`vercel --prod` locally: the repo is not `.vercel`-linked and the CLI will go
interactive. See the shipping workflow in `CLAUDE.md`.
