// Palette derived from the Utku logo (green / coral / periwinkle / mauve),
// brightened for legibility on the dark 3D ground. The five accents also live
// inline on each project in projects.ts (via the palette sweep); this module is
// the single source of truth for the world's ATMOSPHERE (sky, fog, water, sun,
// entrance glow) so the mood stays cohesive.
export const T = {
  // logo-family accents
  peri: "#6E86D6",
  coral: "#E7684A",
  green: "#3FA46A",
  mauve: "#CB7BC7",
  sand: "#E0A45C",

  // atmosphere
  sky: "linear-gradient(180deg, #101f1c 0%, #24304c 42%, #4b3a5c 70%, #b56a4d 100%)",
  fog: "#4a4560", // dusk haze the distant islands fade into
  skyBounce: "#c3c9e6", // hemisphere sky light (periwinkle-tinted)
  ground: "#141a18", // hemisphere ground light
  sunLight: "#ffcaa0", // warm directional key

  water: "#16283c", // periwinkle-dusk sea
  entranceGlow: {
    coral: "rgba(231,104,74,0.10)",
    peri: "rgba(94,116,197,0.09)",
  },

  // Free-surf shifts to a bright, cheerful daytime (the rail/career world stays
  // dusk). Sky gradient for the page wrapper + a turquoise daytime sea.
  daySky: "linear-gradient(180deg, #4aa6e0 0%, #7fc6e8 45%, #a9e0e6 74%, #d9f2ef 100%)",
  dayWater: "#1f7fa6", // bright turquoise
};
