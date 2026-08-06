# Performance

Audited 2026-08-07 against the built output and live headers. This file records
what was wrong, what is now guarded, and what is still open.

## The critical path

| | raw | gzip |
| --- | --- | --- |
| Before | 1,464 KB | 428 KB |
| Now | 564 KB | 185 KB |

Everything below the first section is smaller than that one change.

## Fixed: three.js was never actually lazy

`CLAUDE.md` and `docs/dependency-audit.md` both claimed the flat/mobile path
never downloaded three.js. **The built output said otherwise, and had for a
while.** `dist/index.html` carried

```html
<link rel="modulepreload" href="/assets/three-*.js">
```

and the entry chunk opened with `import{...}from"./three-*.js"`. Every visitor
downloaded and executed 1.1 MB of WebGL engine before first paint, including
phones that render `FlatMap` and never draw a triangle.

**Cause.** `manualChunks` in its object form (`{ three: ["three", ...] }`) makes
`three` a chunk *entry*, and Rollup then hoists any module shared with the real
entry into it. Three modules got captured: react, react-dom, and fatally
`vite/preload-helper`, whose `__vitePreload` the entry imports **statically**.
One tiny static edge welded the whole chunk to the critical path.

**Fix.** The function form in `vite.config.ts`, claiming the shared modules for a
`react` chunk before three can absorb them.

**This regressed silently once, so verify it after touching chunking:**

```bash
npm run build
grep -c 'three-' dist/index.html          # must be 0
head -c 200 dist/assets/index-*.js        # must not import from the three chunk
```

Note that grepping the entry chunk for three's *code* (`WebGLRenderer` etc.)
gives a false pass. The code genuinely was not duplicated there; the leak was the
import edge.

Because the chunk is genuinely lazy now, `WorldExperience` warms it with
`requestIdleCallback` during the hero, so clicking ENTER does not start a cold
240 KB download.

## Fixed: per-frame and per-visit waste

- **`<Instances frames={3}>`** (`src/world/World.tsx`). drei defaults to
  `frames=Infinity`, so all **680** cube matrices were decomposed, recomposed and
  re-uploaded to the GPU every frame, roughly 52 KB of buffer traffic per frame,
  for a field built once in `useMemo` that never moves.
- **`memo(World)`**. Its props were already referentially stable, so the memo
  actually bails out. Previously every coin pickup in surf mode called
  `setCoins` in `WorldExperience` and reconciled the entire 3D tree mid-run.
- **`dpr={[1, 1.5]}`**. r3f only clamps DPR to the real `devicePixelRatio` for
  the array form; a scalar `1.5` was used verbatim, so 1x displays rendered
  2.25x the fragments they could show. Retina is unchanged.
- **`visible` seeded from `document.hidden`**. `visibilitychange` only fires on
  change, so a deep link cmd-clicked into a background tab ran a full renderer at
  60fps in a tab nobody was looking at. Deep links are exactly what gets shared.
- **`/assets` excluded from the SPA rewrite** (`vercel.json`). The catch-all
  returned `index.html` with HTTP 200 for a missing `.js` URL. With `nosniff` and
  `type="module"` the browser refuses to execute it: a silent white screen with
  no error. Now a miss is an honest 404.

## Verified correct, leave alone

- **drei is not the problem.** It is 6.8 KB of the 1.1 MB chunk (0.6%). The
  chunk is `three` (731 KB) and `@react-three/fiber` (151 KB). Deep imports
  would save approximately nothing.
- **No per-frame allocations** in any of the 12 `useFrame` bodies. Vectors are
  pre-allocated and reused, materials are module singletons.
- **Instancing architecture** is right: 680 cubes, one draw call, per-instance
  color.
- **Shadow maps are off entirely**; contact shadows are flat decals.
- **Raycasting** only tests the handful of meshes with handlers, never the 680
  instances.
- **Compression**: `content-encoding: br` on HTML, JS and CSS.
- **Asset caching**: `/assets/*` immutable for a year.
- **The hero** writes to `textContent`/`style.transform` directly rather than
  setting state per frame.

## Still open

1. **Defer posthog-js.** 243 KB, 65% of what remains on the critical path, and
   nothing it does is needed before first paint: the first funnel event cannot
   fire until the visitor clicks. Load it on idle behind a small queue so
   `track()` calls made before it resolves are flushed on load. Also worth
   re-deciding `disable_session_recording: false` — with everything masked,
   replay buys mouse paths and DOM structure for a large chunk of that weight.
2. **Self-host the font.** The Google Fonts stylesheet is the last
   render-blocking third-party resource: measured TTFB 303 ms, and the woff2
   (27 KB) sits behind a second origin, serialized after it. Copy the latin
   variable woff2 into `/public`, declare `@font-face` in `src/index.css`,
   preload it, and add `size-adjust`/`ascent-override` so the swap does not
   reflow the hero.
3. **Route-split `Resume`, `FlatMap`, `ProjectPanel`, `AvatarSelect`** (~31 KB).
   Worth doing only after item 1, otherwise it measures as noise.
4. **Instance the surf coins.** 42 coins x 3 meshes = 126 draw calls, 84 of them
   transparent and depth-sorted, against roughly 50 to 60 for the entire rail
   path. Three `<Instances>` collapses it to 3. Surf mode only, which is a bonus
   path, so weight it accordingly.
5. **Ocean plane density.** `[1400, 1400, 180, 180]` is 65K triangles with five
   `waveH` evaluations per vertex, sized for surf mode but paid for on the rail,
   where fog far is 130 and most of it is invisible. Swap density on `surfing`,
   or compute the wave normal analytically instead of by four extra samples.

## Unrelated thing worth an eyeball

`CameraRig.tsx` initializes `enterT` to `entered ? 1 : 0`, but `World` only
mounts once `entered` is already true, so `enterT` starts at 1 and the cinematic
dive from the establishing shot never plays. `HeroIntro`'s docstring also
describes the world being alive behind the hero copy, which the current mount
condition prevents. Both read as drift from an earlier structure. Needs a browser
to confirm what it looks like.
