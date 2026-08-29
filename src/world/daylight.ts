// Shared daylight level (0 = dusk, 1 = bright daytime), a non-React channel like
// surf-signal.ts. DaylightRig (in World) eases it toward 1 while surfing; the
// water reads it to brighten toward turquoise. Keeps the cross-fade off React.
export const daylight = { v: 0 };

/**
 * Where the key light sits. Shared because two files have to agree on it: the
 * directional light in World.tsx, and the sea's glitter bearing in Ocean.tsx.
 * If those drift apart the ocean sparkles away from its own sun, so there is
 * exactly one number rather than a comment asking two files to stay in step.
 */
export const SUN_POSITION: [number, number, number] = [70, 14, -24];
