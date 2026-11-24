# Design system memory

Use this palette for all future visual work. `src/theme.ts` is the runtime source
of truth; this file explains the intended roles so palette choices stay coherent.

| Role | Color |
| --- | --- |
| Forest | `#2C4832` |
| Coral | `#D76F53` |
| Mauve | `#C57EC2` |
| Blue | `#6273BF` |
| Brick | `#C35946` |
| Amber | `#F19C23` |
| Gold | `#EAC435` |
| Sage | `#C2D076` |
| Seafoam | `#80B192` |
| Sky blue | `#64A6BD` |
| Ocean | `#2E86AB` |
| Violet | `#7265A6` |
| Berry | `#B05A7E` |
| Red | `#B33B49` |

Taupe monochrome provides the default UI contrast ladder: `#FBFAF9`, `#F3F1F1`,
`#E8E4E3`, `#D8D2D0`, `#ABA09C`, `#7C6D67`, `#5B4F4B`, `#473C39`, `#2B2422`,
`#1D1816`, `#0C0A09`.

Usage rules:

- Use taupe ink for page and panel surfaces, and taupe text for body copy. Do not
  reintroduce blue-black UI surfaces or neon cyan/magenta effects.
- Use blue, coral, mauve, gold, and seafoam as sparse project/data accents. Seafoam,
  rather than forest, is the accessible green accent on dark UI.
- The 3D atmosphere is forest-to-taupe-to-coral dusk with an amber sun and ocean-blue
  water. Free-surf shifts toward sky blue, seafoam, and sage.
- **The world has its own colours. Never paint 3D geometry with UI tokens.** The
  islands used to be `inkRaised` and `border`, the panel colours, and read as
  near-black slabs; the distant range was `surface`. The 3D-only tokens are:

  | Role | Token | Color |
  | --- | --- | --- |
  | Island deck | `terrain` | `#9A6E66` |
  | Island flank | `terrainCliff` | `#6E4A48` |
  | Distant range | `mountain` | `#7E5A72` |
  | Deck stones | `rock` / `rockLight` | `#5E5060` / `#7C6A74` |
  | Dry grass | `dryGrass` | `#C29A5C` |
  | Dusk haze (fog) | `fog` | `#B97A6C` |
  | Hemisphere sky light | `skyBounce` | `#B892C4` |
  | Hemisphere ground light | `ground` | `#5A3A35` |

- **On the rail, the sky you see is fog.** The camera looks down and the sea runs to
  the top of the frame, so `fog` colours the upper third of every shot and the CSS
  `sky` gradient is not visible there at all. Tune the haze, not the gradient.
- **Light colour decides the water.** The sea is lit mostly by the hemisphere sky
  light because it faces up. A sage `skyBounce` turned the ocean-blue material
  teal and greyed it where it met the coral haze; lilac keeps it blue. Change the
  light before reaching for the water colour.
- The 2026-11-24 pass that set these was measured against `main` on the same rail
  view: draw calls unchanged (47.6), triangles +2,100 from the deck scatter, which
  rides the existing cube `<Instances>`, and frame time within run-to-run noise.
- Add new interface colors to `src/theme.ts` first. Case-study historical data is
  normalized with `paletteColor()` at render time.
