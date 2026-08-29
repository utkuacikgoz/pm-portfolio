import { useEffect, useRef } from "react";
import { T } from "../theme";
import {
  STEER_RADIUS,
  isBoostDrag,
  isDoubleTap,
  isTap,
  resetSurfTouch,
  steerFromDrag,
  surfTouch,
  throttleFromDrag,
} from "../world/surf-touch";

// The phone's surf controls: one full-screen drag surface over the canvas.
// Press anywhere, and the ring that appears is the anchor: steer by pulling
// sideways, brake by pulling down, boost by pulling up, tap to ollie, double tap
// for a 360. Whichever hand happens to be free works, because the anchor is
// wherever the thumb lands rather than a fixed pad in a corner nobody can reach
// one-handed on a big phone.
//
// Every value it reads is computed by the pure helpers in `world/surf-touch`,
// and it writes them into that module's shared channel. NOTHING here goes
// through React state: a steering value must not reconcile a component tree, let
// alone one sitting over the heaviest scene in the app, sixty times a second.
// The ring and knob are moved by writing transforms straight onto two refs.

const RING = STEER_RADIUS; // the ring reads as the distance to full lock
const KNOB = 30;

export default function SurfTouchPad() {
  const ring = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0, at: 0 });
  const travelled = useRef(0);
  const lastTapAt = useRef(-Infinity);

  // The channel is live for exactly as long as the pad is mounted. The frame
  // loop reads `enabled` to decide whether the board drives itself, so leaving
  // it set after an exit would leave a phantom throttle on the desktop path.
  useEffect(() => {
    surfTouch.enabled = true;
    return () => {
      surfTouch.enabled = false;
      resetSurfTouch();
    };
  }, []);

  const show = (x: number, y: number) => {
    if (ring.current) {
      ring.current.style.transform = `translate3d(${x - RING}px, ${y - RING}px, 0)`;
      ring.current.style.opacity = "0.45";
    }
    moveKnob(x, y);
  };

  const moveKnob = (x: number, y: number) => {
    if (!knob.current) return;
    knob.current.style.transform = `translate3d(${x - KNOB / 2}px, ${y - KNOB / 2}px, 0)`;
    knob.current.style.opacity = "0.75";
  };

  const hide = () => {
    if (ring.current) ring.current.style.opacity = "0";
    if (knob.current) knob.current.style.opacity = "0";
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return; // one finger drives; ignore the rest
    pointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY, at: e.timeStamp / 1000 };
    travelled.current = 0;
    show(e.clientX, e.clientY);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    // Peak distance, not final: a tap that flicks out and back is still a drag,
    // and treating it as an ollie would fire tricks during hard carves.
    travelled.current = Math.max(travelled.current, Math.hypot(dx, dy));
    surfTouch.steer = steerFromDrag(dx);
    surfTouch.throttle = throttleFromDrag(dy);
    surfTouch.boost = isBoostDrag(dy);
    // Clamp the knob to the ring so the control keeps reading as "this far is
    // full lock" instead of trailing the thumb off across the screen.
    const dist = Math.hypot(dx, dy);
    const scale = dist > RING ? RING / dist : 1;
    moveKnob(origin.current.x + dx * scale, origin.current.y + dy * scale);
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    const now = e.timeStamp / 1000;
    const tapped = isTap(travelled.current, now - origin.current.at);
    // Hands off the glass means hands-off cruise. This clears the one-shot trick
    // flags too, so the tap below has to be armed AFTER it rather than before.
    resetSurfTouch();
    if (tapped) {
      // Same rule as double Space: a second tap upgrades the trick instead of
      // queueing another ollie behind the first.
      if (isDoubleTap(now, lastTapAt.current)) surfTouch.spin = true;
      else surfTouch.jump = true;
      lastTapAt.current = now;
    }
    hide();
  };

  return (
    <div
      aria-hidden
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30, // under the HUD (exit button, cards), over the canvas
        // Without this the browser owns the gesture: a sideways drag scrolls the
        // page and a double tap zooms it, and the board never sees either.
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        ref={ring}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: RING * 2,
          height: RING * 2,
          borderRadius: "50%",
          border: `1px solid ${T.blue}`,
          opacity: 0,
          transition: "opacity .18s ease",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
      <div
        ref={knob}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: KNOB,
          height: KNOB,
          borderRadius: "50%",
          background: T.blue,
          opacity: 0,
          transition: "opacity .18s ease",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
