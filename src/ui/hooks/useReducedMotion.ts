import { useSyncExternalStore } from "react";

// Live `prefers-reduced-motion` as a hook. Used to gate JS-driven motion
// (count-ups, magnetic hover, camera easing) that the CSS media query can't
// reach. CSS animations are handled globally in index.css.
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  if (typeof matchMedia === "undefined") return () => {};
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot() {
  return typeof matchMedia !== "undefined" && matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
