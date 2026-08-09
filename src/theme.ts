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

  // In-world panel scrims. Taupe ink at opacity, NOT the blue-black these used
  // to be: the world behind them is forest to taupe to coral dusk, and a cool
  // grey-blue card floating over a warm scene was the loudest inconsistency in
  // the interface. Same ladder as `ink`, so panels read as the same material.
  scrimSoft: "rgba(29,24,22,0.8)",
  scrim: "rgba(29,24,22,0.86)",
  scrimStrong: "rgba(29,24,22,0.92)",

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

/**
 * Type scale. The UI had grown twenty distinct sizes, including half-steps
 * (10.5, 12.5, 13.5, 14.5) that nobody can perceive but everybody has to keep
 * consistent. These seven, roughly a 1.2 ratio, cover every previous use.
 *
 * The hero keeps its `clamp()` sizes: those are fluid by design, not steps.
 *
 * A test asserts no raw numeric `fontSize` survives in src, so the scale cannot
 * quietly reacquire a 14.5.
 */
export const TYPE = {
  micro: 11, // eyebrows, tags, chart legends
  small: 13, // meta lines, chips, secondary buttons
  body: 15, // body copy, primary controls
  lead: 18, // subheads and lead paragraphs
  title: 22, // section titles
  display: 27, // panel headings
  metric: 32, // chart figures
} as const;

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

// Accents are chosen for the 3D scene, where they sit on lit geometry. Several
// of them do not survive being used as small text on a dark taupe panel: blue,
// the accent of the first and most-read case study, lands at 3.43 against
// `inkRaised` where AA wants 4.5.
//
// Rather than lighten the palette (and with it every island), these are the
// same hue lifted just past the threshold, applied only where an accent is
// rendered as TEXT. Fills, borders, emblems and 3D keep the true accent.
// Measured against `inkRaised` (#2B2422), the darkest surface any of them lands
// on; each is >= 4.5 there and >= 5.2 on `ink`.
const TEXT_SAFE_ACCENTS: Record<string, string> = {
  "#6273BF": "#7789D6", // blue    3.43 -> 4.60
  "#2E86AB": "#3996BD", // ocean   3.71 -> 4.55
  "#7265A6": "#9083C5", // violet  2.99 -> 4.53
  "#B05A7E": "#C87095", // berry   3.34 -> 4.50
  "#B33B49": "#E36170", // red     2.64 -> 4.51
  "#C35946": "#DA6C58", // brick   3.51 -> 4.55
  "#2C4832": "#719479", // forest  1.51 -> 4.51
};

/** An accent safe to render as text on the taupe surfaces. Pass-through when it already clears AA. */
export const textAccent = (color: string) =>
  TEXT_SAFE_ACCENTS[paletteColor(color).toUpperCase()] ?? paletteColor(color);
