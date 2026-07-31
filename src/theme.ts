// Portfolio palette: forest / coral / mauve / blue, anchored by the supplied
// taupe monochrome scale. The five project accents also live inline in
// projects.ts; this module owns the shared atmosphere and interface tokens.
export const T = {
  // main accents
  forest: "#2C4832",
  coral: "#D76F53",
  mauve: "#C57EC2",
  blue: "#6273BF",

  // supportive accents
  brick: "#C35946",
  amber: "#F19C23",
  gold: "#EAC435",
  sage: "#C2D076",
  seafoam: "#80B192",
  skyBlue: "#64A6BD",
  ocean: "#2E86AB",
  violet: "#7265A6",
  berry: "#B05A7E",
  red: "#B33B49",

  // Compatibility aliases for the existing project data and surf journey.
  peri: "#6273BF",
  green: "#80B192",
  sand: "#EAC435",

  // taupe monochrome: legible dark UI chrome, not blue-black.
  ink: "#1D1816",
  inkRaised: "#2B2422",
  surface: "#473C39",
  border: "#5B4F4B",
  textMuted: "#ABA09C",
  textSoft: "#D8D2D0",
  text: "#FBFAF9",

  // atmosphere
  sky: "linear-gradient(180deg, #1D1816 0%, #2C4832 34%, #473C39 64%, #D76F53 100%)",
  fog: "#5B4F4B", // taupe dusk haze the distant islands fade into
  skyBounce: "#C2D076", // sage-tinted hemisphere sky light
  ground: "#1D1816", // hemisphere ground light
  sunLight: "#F19C23", // warm amber directional key

  water: "#2E86AB", // ocean-blue dusk sea
  entranceGlow: {
    coral: "rgba(215,111,83,0.14)",
    blue: "rgba(98,115,191,0.12)",
  },

  // Free-surf shifts to a bright, cheerful daytime (the rail/career world stays
  // dusk). Sky gradient for the page wrapper + a turquoise daytime sea.
  daySky: "linear-gradient(180deg, #64A6BD 0%, #80B192 48%, #C2D076 100%)",
  dayWater: "#2E86AB", // bright ocean blue
};

// Case-study content is data, and its older accent values occur in historical
// records. Normalize them at render time so every visible chart follows the
// current palette without coupling content files to a presentation module.
const LEGACY_ACCENTS: Record<string, string> = {
  "#3FA46A": T.seafoam,
  "#E7684A": T.coral,
  "#6E86D6": T.blue,
  "#CB7BC7": T.mauve,
  "#E0A45C": T.gold,
};

export const paletteColor = (color: string) => LEGACY_ACCENTS[color.toUpperCase()] ?? color;
