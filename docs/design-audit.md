# Visual quality audit

2026-08-07. Audited from the code that produces the visuals: palette use against
`docs/design-system.md`, computed WCAG contrast, structure silhouettes from
`geometry.ts`, and typographic consistency. **No browser was involved**, so this
covers what is measurable, not what it feels like. Anything about taste, motion
or lighting still needs eyes.

> **Status:** sections 1 and 2 are fixed (see the entries below). Sections 3
> (silhouettes) and 4 (type scale) are still open and want eyes on a browser.

## 1. The design system is documented, then contradicted [FIXED]

`docs/design-system.md` says plainly: *"Do not reintroduce blue-black UI
surfaces."* Every in-world panel does exactly that.

| What | Where | Value | Should be |
| --- | --- | --- | --- |
| HUD / card scrims (11 uses) | `SurfJourneyStatus`, `EggToast`, `WorldExperience` | `rgba(7,8,12,0.8-0.92)` | taupe ink, `rgba(29,24,22,α)` |
| Escape hatch button | `EscapeHatch.tsx:21,26` | `#fff` | `T.text` (`#FBFAF9`) |
| Checkpoint card title | `WorldExperience.tsx:595` | `#fff` | `T.text` |
| Disabled chevron, inactive dots | `WorldExperience.tsx:788,848,849` | `#2a2e3a` | `T.surface` / `T.border` |
| Dismiss link | `WorldExperience.tsx:674` | `#8b90a0` | `T.textMuted` |

`rgba(7,8,12)` is a cool blue-black. The world behind it is forest to taupe to
coral dusk. A cold grey-blue panel floating over a warm dusk scene is the single
most visible inconsistency in the interface, and it is on screen during the
entire surf run.

**Fixed.** `T.scrimSoft` / `T.scrim` / `T.scrimStrong` were added to `theme.ts`
as taupe ink at opacity, and all eleven call sites now use them; the stray
`#fff`, `#000`, `#2a2e3a` and `#8b90a0` values are tokens too. A test asserts
the scrims stay on `rgba(29,24,22,...)` so blue-black cannot creep back.

## 2. Contrast: the blue accent fails on text [FIXED]

Computed against the taupe surfaces (WCAG AA needs 4.5 for body, 3.0 for large
or UI boundaries).

| Accent | on `inkRaised` | on `ink` | Verdict as text |
| --- | --- | --- | --- |
| **blue `#6273BF`** | **3.43** | **3.95** | **fails AA** |
| gold | 9.03 | 10.42 | fine |
| sage | 9.13 | 10.53 | fine |
| amber | 6.91 | 7.97 | fine |
| seafoam | 6.26 | 7.22 | fine |
| mauve | 5.18 | 5.98 | fine |
| coral | 4.56 | 5.26 | passes, barely |
| ocean | 3.71 | 4.28 | fails |
| brick | 3.51 | 4.05 | fails |
| berry | 3.34 | 3.86 | fails |
| violet | 2.99 | 3.46 | fails, even large |
| red | 2.64 | 3.05 | fails, even large |
| forest | 1.51 | 1.74 | fails badly |

Blue is the problem in practice, because it is used as text in five places:
the resume subtitle (18px), the flat-map subtitle (16px), the LINKEDIN chip
(13px), and, as BiLira's accent, every section label in its case study at 11px.
BiLira is the first and strongest study, so the worst contrast is on the page
most likely to be read.

Forest is already documented as display-only ("seafoam, rather than forest, is
the accessible green accent"), and ocean/violet/red currently appear in 3D and
chart fills rather than as text, which is fine. Blue is the live defect.

**Fix:** lighten blue at the same hue (229 degrees) until it clears AA:

```
#6273BF  3.43  today
#7284D3  4.32
#7B8DDE  4.87  <- clears AA on both taupe surfaces
```

**Fixed, without touching the 3D scene.** Lightening `T.blue` itself would have
lightened BiLira's island too, so instead `textAccent()` in `theme.ts` maps the
accents that fail *as text* to a same-hue variant that clears AA, and passes
everything else through untouched. Fills, borders, emblems and all 3D keep the
true accent; only text uses the lifted one. Blue goes 3.43 to 4.60 on
`inkRaised`. It composes with `paletteColor()`, so legacy content colors are
normalized first.

The mapping covers blue, ocean, violet, berry, red, brick and forest. A test
walks every published project accent and asserts the text colour clears 4.5 on
both panel surfaces, so a new project cannot introduce an unreadable label.

Two lesser ones: `T.border` (`#5B4F4B`) is 1.93 against `inkRaised`, under the
3.0 bar for a boundary that is the only thing defining a control; and
`textMuted` on `surface` is 4.18, just under AA.

## 3. Shapes: the silhouette hierarchy is accidental [FIXED]

Structure heights, computed from `buildStructure`, against an island that is
about 8.4 units wide:

| Project | Structure | Height | Reads as |
| --- | --- | --- | --- |
| BiLira | tower | 9.1 | taller than the island is wide |
| La3eb | arcade | 5.1 | clear landmark |
| Upshift | bridge | 3.1 | low but legible |
| Apollo | campus | 2.5 | nearly flat |
| Mestores | market | 2.5 | nearly flat |

From a fixed iso camera, two of the five islands are essentially a disc with
some cubes on it. The order happens to track "first project is tallest", so the
world reads as decaying rather than as five distinct places. The emblems carry
the domain meaning, which is what saves it, but the islands themselves are not
pulling their weight for Mestores and Apollo.

Also worth noting: every island uses the identical terrain disc, the same four
layers at radii 4.2 / 3.6 / 2.6 / 1.4 with the same jitter rule. Only the top
layer's accent tint and the structure differ. Varying the radii or the plan
shape per island (a seed is already threaded in) would make each one read as a
place rather than the same plate five times.

**Fixed for silhouettes.** Mestores gained a sign mast and hanging board, Apollo
a central block with a beacon and cross arm, and Upshift's span was lifted onto
taller pylons:

| Project | Structure | Was | Now | Emblem |
| --- | --- | --- | --- | --- |
| BiLira | tower | 9.1 | 9.1 | 10.6 |
| Mestores | market | 2.5 | 6.2 | 8.0 |
| Apollo | campus | 2.5 | 6.7 | 8.4 |
| La3eb | arcade | 5.1 | 5.1 | 6.8 |
| Upshift | bridge | 3.1 | 5.3 | 7.2 |

The emblem hover table moved from `Emblems.tsx` into `geometry.ts` so it can be
tested against the real structure heights. It had drifted in both directions:
emblems floated at 6.1 over 2.5-tall structures, while the 9.1 tower punched
straight through its own emblem at 8.5. Three invariants now hold it: every
published structure clears 4.5, every emblem clears its structure by at least 1,
and the skyline is not allowed to descend monotonically along the travel order.

**Terrain variance is deliberately NOT done.** Varying island radii per seed
would desync the fake contact shadows in `Ocean.tsx`, which are drawn at a fixed
`scale={[1.35, 0.62, 1]}` per island with no knowledge of the terrain radius. It
is worth doing, but the shadow decals have to become radius-aware in the same
change, and that wants a browser.

## 4. Typography has no scale

Twenty distinct font sizes across the DOM UI:

```
10  10.5  11  11.5  12  12.5  13  13.5  14  14.5  15  16  17  18  19  20  22  26  27  30
```

The half-steps (10.5, 12.5, 13.5, 14.5) are differences nobody can perceive but
everybody has to maintain. A seven-step scale, say 12 / 13 / 15 / 18 / 22 / 27 /
clamp for the hero, covers every current use.

Weights are 600 (x4), 700 (x20), **800 (x46)**, 900 (x17). With 800 on nearly
everything, weight has stopped being a hierarchy signal: size and color are
doing that work alone, and boldness is just texture.

Radii are 2, 3, 4, 8, 12, 999. The 2/3/4 group is interchangeable noise.

## 5. Verified fine

- Palette tokens themselves match `design-system.md` exactly.
- `paletteColor()` normalizes legacy content colors at render, so case-study
  data cannot drift the palette.
- The taupe ladder is used correctly for text: `text`, `textSoft` and
  `textMuted` all clear AA on `ink` and `inkRaised`.
- Avatar SVGs carry their own DiceBear palette. Generated assets, out of scope.
- `#f2a900` (coin) and `#e6f7f2` (foam) are deliberate object colors in the 3D
  scene, not interface surfaces.

## Suggested order

1. **Retire the blue-black scrims** (section 1). Mechanical, no taste calls,
   removes the most visible inconsistency.
2. **Fix the blue** (section 2). One token, but it needs checking in the 3D
   scene as well as the DOM.
3. **Type scale** (section 4). Contained, mostly find-and-replace, but it will
   shift spacing slightly and wants a look.
4. **Silhouettes** (section 3). The most interesting and the most subjective:
   raising Mestores and Apollo, or varying the terrain per island, changes how
   the world reads. Worth doing with eyes on it.
