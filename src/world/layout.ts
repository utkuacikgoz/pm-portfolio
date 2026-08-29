// Where the islands sit, and nothing else.
//
// These three numbers are the only thing the DOM shell needs to know about the
// world's layout, and they used to live in `geometry.ts` beside the procedural
// builders. Importing one constant from there pulled the whole builder module
// into the entry chunk for every visitor, including the flat mobile path that
// never renders a triangle. Splitting the constants out is what lets the
// builders stay behind the lazy world import where they belong.
import { PUBLISHED_PROJECTS } from "../projects/projects";

/** How many employment islands the rail carries. */
export const EMP_COUNT = PUBLISHED_PROJECTS.length;

/** Sea level. Everything floating is placed relative to this. */
export const WATER_Y = -3.4;

/** The separate indie island sits past the gap at the end of the rail. */
export const INDIE_INDEX = EMP_COUNT;
