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
- Add new interface colors to `src/theme.ts` first. Case-study historical data is
  normalized with `paletteColor()` at render time.
