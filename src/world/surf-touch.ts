// Touch handling for free surf: the drag -> steer / pace / trick mapping, kept
// pure and out of both the DOM overlay that reads the gestures and the frame
// loop that consumes them, so it can be tuned and asserted without a browser.
//
// The phone scheme is deliberately NOT the desktop one with on-screen buttons.
// A thumb cannot hold a direction, a throttle and a jump at once, and a pad of
// arrows would cover the exact part of the screen the ocean is on. Instead the
// board always drives forward and ONE drag, anchored wherever the thumb happens
// to land, owns both axes: sideways steers, downward brakes, upward boosts. A
// tap is the ollie and a double tap the 360, matching Space and double Space so
// the two input schemes describe the same board.

/** Sideways drag, in px, for full steering lock. */
export const STEER_RADIUS = 88;
/** Sideways slack, in px, before a drag steers at all. */
export const STEER_DEADZONE = 6;
/** Downward drag, in px, from cruise to a dead stop. */
export const PACE_RADIUS = 130;
/**
 * Vertical slack, in px, before a drag touches the throttle. Generous on
 * purpose: a thumb arcing left and right also travels up and down, and braking
 * on every carve would read as the board bogging down at random rather than as
 * a control the visitor is holding.
 */
export const PACE_DEADZONE = 34;
/** Upward drag, in px, that engages the boost (the touch equivalent of Shift). */
export const BOOST_THRESHOLD = 56;
/** A press that travels less than this (px) is a tap rather than a drag. */
export const TAP_MAX_DRAG = 14;
/** ...and is over within this long (seconds). */
export const TAP_MAX_SECONDS = 0.3;
/**
 * A second tap inside this window turns the ollie into a 360. Slightly wider
 * than the keyboard's DOUBLE_SPACE_WINDOW: a thumb has to leave the glass and
 * come back, where a key only has to rise and fall.
 */
export const DOUBLE_TAP_WINDOW = 0.36;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp11 = (v: number) => (v < -1 ? -1 : v > 1 ? 1 : v);

/** Drag past a deadzone, keeping the sign and starting from zero at the edge. */
function beyond(delta: number, deadzone: number): number {
  const past = Math.abs(delta) - deadzone;
  return past <= 0 ? 0 : Math.sign(delta) * past;
}

/**
 * Steering input from the horizontal drag, in the frame loop's own convention:
 * POSITIVE IS LEFT, because there the input is `left - right`. A rightward drag
 * is a positive dx and has to steer right, so the sign flips here rather than
 * at the call site.
 */
export function steerFromDrag(dx: number): number {
  const past = beyond(dx, STEER_DEADZONE);
  // Early out rather than negating zero: -0 is a fine number to steer with, but
  // it is a confusing one to read in a log or an assertion.
  if (past === 0) return 0;
  return clamp11(-past / STEER_RADIUS);
}

/**
 * Throttle from the vertical drag, 0..1. Anything that is not a deliberate
 * downward pull is full cruise: on a phone the board has to keep moving while
 * the thumb is busy steering, or every carve costs the pace that makes carving
 * worth doing.
 */
export function throttleFromDrag(dy: number): number {
  const braking = beyond(dy, PACE_DEADZONE);
  if (braking <= 0) return 1;
  return clamp01(1 - braking / PACE_RADIUS);
}

/** Pulling up past the threshold is the boost, as long as it IS a pull up. */
export function isBoostDrag(dy: number): boolean {
  return dy <= -BOOST_THRESHOLD;
}

/** Did a press end as a tap (the ollie) rather than as a steering drag? */
export function isTap(dragPx: number, seconds: number): boolean {
  return dragPx <= TAP_MAX_DRAG && seconds >= 0 && seconds <= TAP_MAX_SECONDS;
}

/** Two taps close enough together to mean a 360 instead of a second ollie. */
export function isDoubleTap(now: number, previous: number): boolean {
  const elapsed = now - previous;
  return elapsed > 0 && elapsed <= DOUBLE_TAP_WINDOW + 1e-6;
}

/**
 * Live touch state, shared between the DOM overlay that writes it and the frame
 * loop that reads it. A module channel rather than React state for the same
 * reason `daylight` and `surfSignal` are: this changes on every pointer event
 * and must never reconcile the scene to deliver a steering value.
 */
export interface SurfTouchState {
  /** The pad is mounted, so the board drives itself and touch owns the controls. */
  enabled: boolean;
  /** -1..1, positive is left (same convention as the keyboard input). */
  steer: number;
  /** 0..1. Rests at full cruise, not at zero: no thumb still means forward. */
  throttle: number;
  boost: boolean;
  /** One-shot trick requests, consumed (and cleared) by the controller. */
  jump: boolean;
  spin: boolean;
}

export const surfTouch: SurfTouchState = {
  enabled: false,
  steer: 0,
  throttle: 1,
  boost: false,
  jump: false,
  spin: false,
};

/** Back to hands-off cruise. Called when a press ends and when the pad unmounts. */
export function resetSurfTouch(): void {
  surfTouch.steer = 0;
  surfTouch.throttle = 1;
  surfTouch.boost = false;
  surfTouch.jump = false;
  surfTouch.spin = false;
}
