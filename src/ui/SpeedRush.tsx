import { useEffect, useRef } from "react";
import { surfSignal } from "../world/surf-signal";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";

// What speed FEELS like, drawn outside the canvas.
//
// The scene already sells pace three ways (the lens widens, the camera falls
// back and drops, the tail washes out), and all three are things happening to
// the world. None of them happen to the VIEWER. A vignette that closes in and a
// warm rush at the very edges of frame are that, and doing it in CSS rather
// than a post-processing pass means no second render target, no extra GL
// context, and no cost at all on a phone: two composited layers whose opacity
// changes.
//
// It is deliberately NOT literal speed lines. A repeating-conic-gradient of
// fine radial streaks is the obvious way to draw those and it looked wrong on a
// real screen: at a degree or so of arc the lines fall below a pixel out near
// the edges, so they alias into moire and the flat dusk sky reads as screen
// tearing rather than as speed. Two soft gradients cannot do that on any GPU or
// pixel density.
//
// It reads `surfSignal.pace` on its own animation frame and writes opacity
// straight onto two refs. No React state: pace changes every frame, and a
// component that re-rendered for it would reconcile the whole overlay sixty
// times a second over the heaviest scene in the app.

/** Pace below which nothing shows at all: cruising should not look frantic. */
const FLOOR = 0.45;
/** Peak strength of each layer at full pace, kept low enough to stay subtle. */
const VIGNETTE_MAX = 0.9;
const EDGE_MAX = 0.5;
/** How fast the effect follows the board, per second. Slower than the board so
 *  a bounce off a rock does not strobe the screen. */
const FOLLOW = 4.5;

export default function SpeedRush() {
  const vignette = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // The whole point of this overlay is the sensation of speed. Someone who
    // has asked for less motion is exactly who should not get it.
    if (reduced) return;
    let raf = 0;
    let shown = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = Math.max(0, (surfSignal.pace - FLOOR) / (1 - FLOOR));
      shown += (target - shown) * (1 - Math.exp(-FOLLOW * dt));
      if (vignette.current) vignette.current.style.opacity = String(shown * VIGNETTE_MAX);
      // Squared: the edge rush is the top end of the range only, so cruising
      // reads as calm and the last stretch of pace reads as commitment.
      if (edge.current) edge.current.style.opacity = String(shown * shown * EDGE_MAX);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  if (reduced) return null;

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 28, pointerEvents: "none" }}>
      <div
        ref={vignette}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          background:
            "radial-gradient(ellipse 78% 68% at 50% 56%, transparent 42%, rgba(9,14,18,0.30) 78%, rgba(9,14,18,0.62) 100%)",
        }}
      />
      {/* A warm rush in the outer frame only, on top of the vignette: the
          corners darken and the edges heat up, which is what a lens does when
          the world is coming at it. */}
      <div
        ref={edge}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          background:
            "radial-gradient(ellipse 92% 84% at 50% 56%, transparent 62%, rgba(215,111,83,0.16) 86%, rgba(215,111,83,0.34) 100%)",
        }}
      />
    </div>
  );
}
