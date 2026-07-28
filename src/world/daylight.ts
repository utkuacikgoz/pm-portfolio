// Shared daylight level (0 = dusk, 1 = bright daytime), a non-React channel like
// surf-signal.ts. DaylightRig (in World) eases it toward 1 while surfing; the
// water reads it to brighten toward turquoise. Keeps the cross-fade off React.
export const daylight = { v: 0 };
