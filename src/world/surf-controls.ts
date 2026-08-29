// Pure surf-control rules, kept outside the render loop so the timing, water
// clearance, handling and camera contracts can be tested without a WebGL canvas.
//
// Everything here is a CURVE against speed. Feel in a surf game does not come
// from top speed, it comes from what changes as you gather pace: the arc opens,
// the tail washes out, the camera falls back and drops toward the water and the
// lens widens. Keeping those curves in one pure module means they can be tuned
// and asserted instead of being buried in a 500-line frame loop.

export const DOUBLE_SPACE_WINDOW = 0.32;
export const BOARD_CLEARANCE = 0.34;

// How far you can roam before the invisible wall deflects you. Exported (rather
// than inlined in SurfController) so the horizon ring can be proved to sit
// outside it: the mountains used to be generated at radius 155 while the wall
// stood at z 130, which put their collision volumes INSIDE the playable water.
// That is why they read as looming rather than distant.
export const SURF_BOUNDS = { minX: -120, maxX: 300, minZ: -200, maxZ: 200 };

/** Pace every handling and camera curve below is normalized against. */
export const CRUISE_SPEED = 26;
/** Peak yaw rate (rad/s) at full steering input and a standstill. */
export const TURN_RATE_MAX = 1.9;
/** Widest the nose may point out of the direction of travel (radians). */
export const MAX_SLIP = 0.33;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp11 = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0 at a standstill, 1 at cruising pace. Every curve below reads off this. */
export function paceRatio(speed: number): number {
  return clamp01(Math.abs(speed) / CRUISE_SPEED);
}

/** Wrap an angle into [-PI, PI]. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/** Frame-rate independent exponential approach factor for a given rate. */
export function approach(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

export function isDoubleSpacePress(now: number, previous: number): boolean {
  const elapsed = now - previous;
  return elapsed > 0 && elapsed <= DOUBLE_SPACE_WINDOW + 1e-6;
}

export function boardFloatY(surfaceY: number, smoothedY: number): number {
  // Smoothing calms the camera, but it must never pull the board below the
  // actual shader-driven water surface.
  return Math.max(surfaceY + BOARD_CLEARANCE, smoothedY);
}

// ── Handling ─────────────────────────────────────────────────────────────────

/**
 * Yaw rate the board is asked for. Bite drops off with pace: you can pivot
 * almost on the spot at a crawl and the arc opens out as you drive, so a fast
 * carve reads as committed rather than twitchy.
 */
export function turnRate(input: number, speed: number): number {
  return input * TURN_RATE_MAX * (1.15 - paceRatio(speed) * 0.45);
}

/**
 * How fast the direction the board TRAVELS chases the direction it POINTS
 * (rad/s). At a crawl the two are the same. At speed the tail washes out, so
 * the board keeps sliding a beat past the input before the line catches up.
 * That lag IS the drift: without it, steering is instantaneous and the board
 * feels like a cursor rather than something with mass on water.
 */
export function courseChase(speed: number): number {
  return mix(11, 3.4, paceRatio(speed));
}

/** Hold a course within MAX_SLIP of the heading so the board can never spin out. */
export function clampSlip(heading: number, course: number): number {
  const slip = wrapAngle(heading - course);
  if (slip > MAX_SLIP) return wrapAngle(heading - MAX_SLIP);
  if (slip < -MAX_SLIP) return wrapAngle(heading + MAX_SLIP);
  return wrapAngle(course);
}

/**
 * Rider/board bank. Weighted toward the RAW input rather than the (already
 * smoothed) yaw rate, so the lean leads the turn: you commit, then the board
 * comes round. Reading it off the yaw rate alone is what made the old carve
 * feel like the rider was reacting to the board instead of steering it.
 */
export function leanTarget(input: number, turnVel: number, speed: number): number {
  const lead = clamp11(input);
  const rate = clamp11(turnVel / TURN_RATE_MAX);
  return (lead * 0.62 + rate * 0.38) * 0.46 * mix(0.45, 1, paceRatio(speed));
}

// ── Chase camera ─────────────────────────────────────────────────────────────
// The camera is most of what "smooth" means. It trails on a spring rather than
// snapping to a fixed offset, and as pace builds it falls back, drops toward
// the water and widens its lens. The old rig sat 6 units above the board at a
// fixed 45 degree lens looking down at it, which put the horizon off the top of
// the frame: the ocean read as a flat teal field with no scale at all.

export const SURF_FOV = 46;
export const SURF_FOV_WIDE = 58;

/** Lens widens with pace (and a touch more in the air) to sell speed. */
export function cameraFov(speed: number, airY: number): number {
  return mix(SURF_FOV, SURF_FOV_WIDE, paceRatio(speed)) + Math.min(2.5, airY * 0.4);
}

/** The window shape every camera curve here was tuned against. */
export const REFERENCE_ASPECT = 16 / 9;
/** At or below this the shape correction is at full strength. */
export const PORTRAIT_ASPECT = 0.85;
/** Widest the lens may be stretched for a narrow window, as a multiple. */
export const MAX_FOV_GAIN = 1.45;
/** ...and in absolute terms, past which the frame reads as a fisheye. */
export const MAX_FOV = 72;

const DEG = Math.PI / 180;

/**
 * `cameraFov` corrected for the window's shape.
 *
 * three's `fov` is VERTICAL, so a portrait phone does not crop the top and
 * bottom off the landscape frame, it crops the SIDES. At 390x844 the same 46
 * degree lens sees about 22 degrees horizontally: a telephoto slit through
 * which you cannot see the break you are carving toward, on the one device
 * where you steer by feel rather than by looking around. Opening the vertical
 * lens buys that horizontal coverage back.
 *
 * It is bought back only PARTLY, on purpose. Holding the landscape horizontal
 * FOV at portrait aspect would need about 117 degrees vertically, which is a
 * fisheye; both caps exist so the correction ends at a wide lens rather than a
 * distorted one, and MAX_FOV_GAIN is the one that keeps the widen-with-speed
 * cue alive instead of pinning every speed to the same clamped value.
 *
 * EVERY LANDSCAPE WINDOW IS RETURNED UNTOUCHED, not only 16:9 ones. The curves
 * above were tuned by eye on a landscape screen and this is a fix for a shape
 * they were never tuned against, not a re-tune of the ones they were. The
 * correction fades in between square and `PORTRAIT_ASPECT` so dragging a
 * desktop window through square does not snap the lens.
 */
export function aspectFov(fov: number, aspect: number): number {
  if (!(aspect > 0) || aspect >= 1) return fov;
  const ideal = (2 * Math.atan((Math.tan((fov / 2) * DEG) * REFERENCE_ASPECT) / aspect)) / DEG;
  const capped = Math.min(ideal, fov * MAX_FOV_GAIN, MAX_FOV);
  return mix(fov, capped, clamp01((1 - aspect) / (1 - PORTRAIT_ASPECT)));
}

/** Falls further back as you drive. */
export function cameraDistance(speed: number, riding: boolean): number {
  return mix(10.6, 14.4, paceRatio(speed)) + (riding ? 1.2 : 0);
}

/** Drops toward the water as you drive: low and fast beats high and safe. */
export function cameraHeight(speed: number, riding: boolean): number {
  return mix(5.3, 3.4, paceRatio(speed)) + (riding ? 3.4 : 0);
}

/**
 * Height of the aim point above the board, which together with `cameraHeight`
 * sets how far the rig pitches down. It SINKS toward the water line as pace
 * builds so the lens levels out, the board drops into the lower third and the
 * horizon climbs into frame: the whole difference between "an ocean" and "a
 * teal plane".
 */
export function cameraLookHeight(speed: number, riding = false): number {
  // Riding lifts the aim point as well as the camera. Raising the rig to clear a
  // breaking face without raising what it aims at pitches it 27 degrees against
  // a 23 degree half-FOV, which puts the horizon back off the top of the frame:
  // the exact failure this whole rig was rebuilt to fix. Physically it is also
  // what a surfer does on a wave, which is look UP the face.
  return mix(2.6, 0.9, paceRatio(speed)) + (riding ? 1.6 : 0);
}

/** Spring constant of the chase camera: softer at speed, so it trails more. */
export function chaseStiffness(speed: number): number {
  return mix(52, 30, paceRatio(speed));
}

/** Just under critical: settles clean, with barely enough overshoot to breathe. */
export const CHASE_DAMPING_RATIO = 0.9;

/** Damping coefficient paired with `chaseStiffness` for that ratio. */
export function chaseDamping(stiffness: number): number {
  return 2 * CHASE_DAMPING_RATIO * Math.sqrt(stiffness);
}

/** A little camera roll into the carve. Subtle: it reads as bank, not as tilt. */
export function cameraBank(lean: number, speed: number): number {
  return clamp11(lean / 0.46) * 0.085 * paceRatio(speed);
}

// ── Contact with the water ───────────────────────────────────────────────────

/** Seconds between foam patches, and how wide each one starts. */
export function wakeInterval(speed: number): number {
  return mix(0.13, 0.055, paceRatio(speed));
}

export function wakeScale(speed: number): number {
  return mix(0.75, 1.6, paceRatio(speed));
}

/**
 * How hard the board is carving, 0..1, from how far the nose is out of the
 * direction of travel. `clampSlip` already holds that angle inside MAX_SLIP, so
 * the ratio is bounded without another clamp.
 *
 * A wake that is the same width whether you are running straight or laying the
 * board over says nothing about what you just did. This is what lets a hard
 * turn leave a readable arc on the water instead of the same dotted line.
 */
export function carveRatio(heading: number, course: number): number {
  return clamp01(Math.abs(wrapAngle(heading - course)) / MAX_SLIP);
}

/** Widens a foam patch thrown while carving: a turn digs a broader trench. */
export function carveWakeScale(scale: number, carve: number): number {
  return scale * (1 + carve * 0.85);
}

/**
 * ...and holds it on the water longer, so the arc is still there to be seen
 * when you come back round and look at it.
 */
export function carveWakeDuration(base: number, carve: number): number {
  return base * (1 + carve * 0.7);
}

/** Below a walking pace the board is not driving enough water to throw any. */
export const SPRAY_MIN_SPEED = 9;

export function sprayRate(speed: number): number {
  const p = clamp01((Math.abs(speed) - SPRAY_MIN_SPEED) / (CRUISE_SPEED - SPRAY_MIN_SPEED));
  return p * p;
}

/** Seconds between droplets. Infinite below `SPRAY_MIN_SPEED`: nothing is emitted. */
export function sprayInterval(speed: number): number {
  const rate = sprayRate(speed);
  return rate <= 0 ? Infinity : mix(0.2, 0.032, rate);
}
