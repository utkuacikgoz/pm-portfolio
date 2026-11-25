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
  // On the rail the camera looks down and the sea runs to the top of the frame,
  // so the upper third of every shot is this colour, not the sky gradient. It
  // was the taupe of the UI border, which made the world read as an overcast
  // evening; a coral dusk haze is the "taupe to coral" the palette describes,
  // and what the distant islands and range now fade into.
  fog: "#B97A6C",
  // Hemisphere SKY light: what every upward face sees, the sea above all.
  // It was sage, a yellow green, which turned the ocean-blue water teal and
  // made it go grey wherever it met the coral haze. A dusk sky dome is lilac,
  // and lit by it the same water material reads blue again.
  skyBounce: "#B892C4",
  // Hemisphere ground light: what every downward and side face is lit by. It
  // was near-black ink, so the flank of every island went black.
  ground: "#5A3A35",
  sunLight: "#F19C23", // warm amber directional key

  // The world's own ground. Island decks and cliffs used to be painted
  // `inkRaised` and `border`, the UI's panel colours, so the islands were the
  // colour of a card background and read as near-black slabs under any light.
  terrain: "#9A6E66", // deck: dusty rose that the amber key lifts to sunset sand
  terrainCliff: "#6E4A48", // flank: a step darker and redder, so the slab has a side
  mountain: "#7E5A72", // the distant range, dusky mauve so it recedes warm
  rock: "#5E5060", // scattered deck stones, slate mauve
  rockLight: "#7C6A74", // the lighter half of them, so the scatter is not one flat tone
  dryGrass: "#C29A5C", // dry grass tufts, the gold the amber key light picks out

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
  // 12, not 11: at 11 the attribution lines and LIVE labels sat below the
  // legibility floor on a phone, which is where most recruiters read them.
  micro: 12, // eyebrows, tags, chart legends
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
