import { useEffect, useState } from "react";

export type ExperienceMode = "world" | "flat";

const SMALL_SCREEN = "(max-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// WebGL support doesn't change at runtime, so probe once and cache. Creating a
// canvas/context on every resize would churn a limited GPU resource.
let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  if (typeof document === "undefined") return (webglSupport = false);
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    // Free the probe context immediately rather than waiting on GC.
    const lose = (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return (webglSupport = !!gl);
  } catch {
    return (webglSupport = false);
  }
}

function computeMode(): ExperienceMode {
  if (typeof window === "undefined") return "flat";
  const smallScreen = window.matchMedia(SMALL_SCREEN).matches;
  const reducedMotion = window.matchMedia(REDUCED_MOTION).matches;
  if (smallScreen || reducedMotion || !hasWebGL()) return "flat";
  return "world";
}

/**
 * Decides whether to render the interactive 3D world or the lightweight flat
 * fallback. Flat when: small screen, reduced-motion preference, or no WebGL.
 * Re-evaluates on resize / preference change so rotating a tablet works.
 * Because <World> is lazy-loaded, the flat path never downloads three.js.
 */
export function useExperienceMode(): ExperienceMode {
  const [mode, setMode] = useState<ExperienceMode>(computeMode);

  useEffect(() => {
    const update = () => setMode(computeMode());
    const small = window.matchMedia(SMALL_SCREEN);
    const motion = window.matchMedia(REDUCED_MOTION);
    small.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      small.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
