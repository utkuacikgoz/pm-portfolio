// The one odometer every rolling number in the reel uses (spec section 2.9).

import { DIGITS } from "./cache";
import type { Odo } from "./cache";
import { clamp } from "./ease";

const EPS = 1e-6;
const POW10 = [1, 10, 100, 1000] as const;

/** Strip position of place p: a higher place rolls only while the one below runs its last unit. */
function strip(x: number, p: number): number {
  if (p === 0) return x;
  const m = POW10[p];
  const q = Math.floor(x / m);
  return q + clamp(x - q * m - (m - 1), 0, 1);
}

/**
 * Draws the rolling places of `o` with its left edge at x0. `value` is in units
 * of the least significant place; `bounce` (in digit pitches) is added to place
 * 0 only. The caller sets font and fill and draws the static glyphs.
 */
export function drawOdometer(ctx: CanvasRenderingContext2D, o: Odo, x0: number, baseline: number, value: number, bounce: number): void {
  let v = value;
  const rv = Math.round(v);
  if (Math.abs(v - rv) < EPS) v = rv;
  const moving = bounce !== 0 || v !== rv;
  const size = o.size;
  if (moving) {
    // Cap band only: vertical clip, never horizontal. It ends 2 px under the
    // baseline (the datum's thickness), so an incoming digit never shows as a
    // bar below the line.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-1e5, baseline - 0.86 * size, 2e5, 0.86 * size + 2);
    ctx.clip();
  }
  const places = o.digits.length;
  for (let p = 0; p < places; p++) {
    const s = p === 0 ? v + bounce : strip(v, p);
    let d = Math.floor(s);
    let f = s - d;
    if (f < EPS) f = 0;
    else if (f > 1 - EPS) {
      d += 1;
      f = 0;
    }
    const gi = o.digits[p];
    const slotX = x0 + o.run.x[gi] + gi * o.tracking;
    const slotAdv = o.run.adv[gi];
    const a = ((d % 10) + 10) % 10;
    const blank = p >= o.minPlaces && d < 1;
    if (!blank) ctx.fillText(DIGITS[a], slotX + (slotAdv - o.digitW[a]) / 2, baseline - f * size);
    if (f > 0) {
      const b = (a + 1) % 10;
      ctx.fillText(DIGITS[b], slotX + (slotAdv - o.digitW[b]) / 2, baseline + (1 - f) * size);
    }
  }
  if (moving) ctx.restore();
}

/** The glyphs that never roll ('$', '.', '%', 'M', '×', '+', 'K'), at their final slots. */
export function drawStatics(ctx: CanvasRenderingContext2D, o: Odo, x0: number, baseline: number): void {
  for (let k = 0; k < o.statics.length; k++) {
    const i = o.statics[k];
    ctx.fillText(o.run.ch[i], x0 + o.run.x[i] + i * o.tracking, baseline);
  }
}
