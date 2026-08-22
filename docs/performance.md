# Performance

Audited 2026-08-07 against the built output and live headers. This file records
what was wrong, what is now guarded, and what is still open.

## The critical path

| | raw | gzip |
| --- | --- | --- |
| Originally | 1,464 KB | 428 KB |
| After the chunking fix | 564 KB | 185 KB |
| Now | 302 KB | 100 KB |

That is a 79% cut raw, 77% gzip.

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

## Fixed: posthog-js, fonts and route splitting

- **posthog-js is off the critical path.** 240 KB, and nothing it does is needed
  before first paint: the first named event cannot fire until someone clicks. It
  now loads via dynamic import on `requestIdleCallback`, and `events.ts` queues
  any `track()` call made before it lands (bounded at 50) and flushes them in
  order once the client attaches. Super properties are registered on the
  instance *before* the drain, so queued events still carry their acquisition
  properties.

  `@posthog/react` was dropped entirely. Nothing consumed its hooks, and
  mounting `PostHogProvider` around the app after load would have remounted the
  whole tree and thrown away world state mid-session. The init is imperative
  instead, which has no such effect.

- **The font is self-hosted.** `fonts.googleapis.com` was the last
  render-blocking third-party resource: a stylesheet at ~300 ms TTFB pointing at
  a *second* origin for the woff2, serialized behind it. Both subsets now sit in
  `public/fonts`, declared in `src/index.css` with Google's own unicode-ranges
  kept, so latin-ext only downloads if a character needs it. The latin file is
  preloaded so its fetch starts with the HTML parse, and `/fonts/*` is cached
  immutable for a year like `/assets/*`.

  Unlike `/assets/*`, these filenames are **not** content-hashed (Vite copies
  `public/` verbatim), so `immutable` only stays honest if a replacement font
  gets a new filename. Rename rather than overwrite.

- **Routes are split.** `Resume`, `ProjectPanel` and `AvatarSelect` are lazy;
  all three mount behind a user gesture or a separate route, so their Suspense
  gap is invisible. Note this made `App.test.tsx` async: see `flushLazy()`, which
  awaits the same dynamic imports rather than hoping one microtask tick is
  enough.

## Fixed: surf coins and the ocean normal

- **Coins are instanced.** 42 coins x 3 meshes was 126 draw calls, 84 of them
  transparent and depth-sorted every frame, against roughly 50 to 60 for the
  entire rail path. Three `<instancedMesh>` makes it 3. Collected coins take a
  zero scale, since instances have no per-instance visibility flag.
- **The ocean normal is analytic.** It came from four extra `waveH` samples
  (central differences), so every vertex on a 180x180 plane evaluated `waveH`
  five times: fifteen sines each. The hand-derived gradient costs three cosines
  and is more accurate than the finite difference it replaces.

## Still open

1. **Ocean plane density.** `[1400, 1400, 180, 180]` is 65K triangles, sized for
   surf mode but paid for on the rail, where fog far is 130 and most of it is
   invisible. Swapping density on `surfing` is the remaining win, but it needs a
   browser: dropping the plane's extent risks exposing the sea edge on the rail,
   and dropping segment count changes how the swell reads.
2. **Font metric overrides.** `size-adjust` / `ascent-override` tuned against the
   fallback stack would remove the swap reflow. Needs a browser to tune, so it
   was left out rather than guessed at.
4. **The hidden `mona` case study** still ships (~8.6 KB) because the registry
   row holds a static `content` reference. Left alone deliberately: `CLAUDE.md`
   treats "add row, flip `published`" as the extensibility contract, and making
   unpublished content lazy is a change to that contract, not a cleanup.

## Hero animation invariant (measured 2026-08-22)

**No infinite animation on the hero may touch `text-shadow`, `box-shadow`,
`background-position` or `filter`. Looping animations get `transform` and
`opacity` only.**

This is not a style preference, it is the difference between 60 fps and 14 fps.
Measured on the built site over a 6 s steady-state window, 1440x900, after the
entrance one-shots had finished:

| loop | raster / 6 s | fps (GPU raster) | fps (software raster) |
| --- | --- | --- | --- |
| all loops running | 5039 ms | 58.5 | **13.8** |
| everything static | 0 ms | 59.8 | 59.8 |
| `wordHeat` alone (`text-shadow` on 82px text) | **5001 ms** | 59.0 | 39.4 |
| `plumeFlow` alone (`background-position` under `filter`) | 33 ms | 60.0 | **23.2** |
| `ctaGlow` alone (`box-shadow`) | 26 ms | 58.0 | 60.0 |
| rocket flame + shudder, 15 sparks, plume pulse | 0 ms | 60.0 | 56.8+ |

Two lessons, both counterintuitive:

1. **`text-shadow` on large text was 99% of all raster on the page.** It is not
   compositable, so every frame repainted five elements plus a 44px blur halo.
   The glow now lives on a `.hero-word::after` that fades `opacity`; the word
   itself keeps a `transform` loop. Raster went to zero.
2. **A GPU hides the `background-position` cost completely** (33 ms) and a
   software rasterizer does not (23 fps on its own). Testing only on a fast Mac
   would have shipped this. The stripes now scroll as a `translate3d` on a child
   whose texture rasterizes once.

Software raster was simulated with `--disable-gpu-rasterization
--num-raster-threads=1`, a stand-in for a low-end or GPU-blocklisted machine,
not a real device. CPU throttling alone (4x, 6x) never dropped below 55 fps on
this hardware and would have missed both findings.

**Note this is a fan-and-battery problem, not a load-time one.** LCP stayed
816 to 824 ms and CLS 0.0006 either way. The pre-fix cost was ~1.5 cores burned
continuously on a static hero. Do not sell fixes like this as load wins.

## Unrelated thing worth an eyeball

`CameraRig.tsx` initializes `enterT` to `entered ? 1 : 0`, but `World` only
mounts once `entered` is already true, so `enterT` starts at 1 and the cinematic
dive from the establishing shot never plays. `HeroIntro`'s docstring also
describes the world being alive behind the hero copy, which the current mount
condition prevents. Both read as drift from an earlier structure. Needs a browser
to confirm what it looks like.
