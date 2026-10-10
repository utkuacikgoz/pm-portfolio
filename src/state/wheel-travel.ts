/**
 * Scroll to travel along the rail. A trackpad sends a burst of small wheel
 * events and then a momentum tail that can run for a second, a mouse sends a
 * few large notches. Both should move exactly one island per gesture, so the
 * deltas accumulate until they pass a threshold, the step fires, and the rail
 * then ignores the wheel until the gesture (and its momentum) has died down.
 */
export interface WheelState {
  acc: number;
  lastAt: number;
  lockUntil: number;
}

export const WHEEL_THRESHOLD = 50; // px of accumulated scroll for one step
// A gesture ends after this much wheel silence. The same quiet both resets a
// half-finished scroll and releases the lock after a step, so a momentum tail
// cannot step twice however sparsely a slow machine delivers it.
export const WHEEL_LOCK_MS = 750;

export const initialWheel = (): WheelState => ({ acc: 0, lastAt: -Infinity, lockUntil: -Infinity });

/** Feed one wheel event; returns the next state and the step to take (-1, 0 or 1). */
export function wheelStep(s: WheelState, delta: number, now: number): { state: WheelState; step: -1 | 0 | 1 } {
  if (now < s.lockUntil) {
    // Momentum from the gesture that already moved: keep extending the lock
    // while it keeps coming, so one long flick cannot take two steps.
    return { state: { acc: 0, lastAt: now, lockUntil: Math.max(s.lockUntil, now + WHEEL_LOCK_MS) }, step: 0 };
  }
  const acc = (now - s.lastAt > WHEEL_LOCK_MS ? 0 : s.acc) + delta;
  if (Math.abs(acc) < WHEEL_THRESHOLD) return { state: { acc, lastAt: now, lockUntil: s.lockUntil }, step: 0 };
  return { state: { acc: 0, lastAt: now, lockUntil: now + WHEEL_LOCK_MS }, step: acc > 0 ? 1 : -1 };
}
