// Monument Valley palette: high-key pastels, paper-cream ground, soft geometric
// light. This replaces the earlier neon-on-black world (see CLAUDE.md, Locked
// product decisions) — the whole site now reads as one calm, sunlit architecture.
//
// Two tiers, deliberately separate:
//   * ACCENT tokens are text-safe. Every one clears 4.5:1 on `bg` and on
//     `surface`, because the site's first job is recruiter-skimmable and pastel
//     on pastel fails contrast silently. Do not lighten these for text use.
//   * The *Soft cousins are for large 3D fills and decoration ONLY, never text.
//
// The five accents also live inline on each project in projects.ts.
export const T = {
  // Accent family — text-safe (see contrast note above)
  peri: "#4F57B0", // indigo
  coral: "#AC4A2D", // terracotta
  green: "#1F7A5E", // sage
  mauve: "#98487F", // plum
  sand: "#8A6118", // ochre

  // Pastel cousins for monument faces and decoration. Never used for text.
  periSoft: "#AEB6EC",
  coralSoft: "#F0B39A",
  greenSoft: "#8FCDB6",
  mauveSoft: "#E4A9CF",
  sandSoft: "#EDCB8E",

  // Surfaces + ink
  bg: "#F4EFE6", // paper cream, the page ground
  surface: "#FCF9F3", // cards, panels
  surfaceVeil: "rgba(252,249,243,0.92)", // same, floated over the canvas
  ink: "#2B2833", // primary text
  inkSoft: "#5C5766", // secondary text
  line: "#DED5C7", // hairlines, borders

  // Atmosphere — a pale sunlit sky the islands sit inside
  sky: "linear-gradient(180deg, #BFE0E4 0%, #DCDCEF 40%, #F2DFDD 74%, #FBF2E6 100%)",
  fog: "#E3E0DC", // distance haze; far islands dissolve into the sky
  skyBounce: "#EAF3F7", // hemisphere sky light
  ground: "#D8CCBC", // hemisphere ground bounce (warm sand)
  sunLight: "#FFF3E0", // soft directional key

  water: "#8FC7CE", // pale lagoon around the rail
  entranceGlow: {
    coral: "rgba(172,74,45,0.10)",
    peri: "rgba(79,87,176,0.09)",
  },

  // Free-surf leaves the pale rail for open ocean: deeper, more saturated water
  // and a bigger sky. The rail is calm and papery; the ocean is vivid. (These
  // were daySky/dayWater when the rail was dusk and surfing was the bright half.)
  surfSky: "linear-gradient(180deg, #4E9FD6 0%, #7CC2E2 45%, #A9DCE4 76%, #DCF1EC 100%)",
  surfWater: "#1E7FA8",

  // Monument stone: the shared masonry every island is built from.
  stone: "#EFE6D8",
  stoneMid: "#DCCFBC",
  stoneDeep: "#C3B49E",
};
