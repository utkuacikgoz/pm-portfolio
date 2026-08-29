import { useEffect, useState } from "react";

type ExperienceMode = "world" | "flat";

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

/**
 * Is the flat path being served ONLY because the screen is small? That is the
 * one flat visitor who can still be offered the 3D ocean: the hardware and the
 * preferences are both willing, the diorama just does not fit.
 *
 * Reduced-motion and no-WebGL visitors are deliberately excluded. For them the
 * flat map is the answer rather than a consolation, and an invitation to a
 * moving 3D world is either unwanted or broken.
 *
 * A coarse pointer is NOT required. The controls are pointer events, so a mouse
 * drag in a narrow desktop window works exactly as a thumb does, and gating on
 * `pointer: coarse` would only add a way for the feature to silently vanish on
 * devices that report their pointer oddly.
 */
function computeTouchSurf(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(SMALL_SCREEN).matches &&
    !window.matchMedia(REDUCED_MOTION).matches &&
    hasWebGL()
  );
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

/**
 * Whether to offer the small-screen visitor the free surf ocean. The flat map
 * stays their default: this is one opt-in button, not a redirect, so the
 * recruiter who came to read case studies still lands on the case studies.
 */
export function useTouchSurf(): boolean {
  const [canSurf, setCanSurf] = useState(computeTouchSurf);

  useEffect(() => {
    const update = () => setCanSurf(computeTouchSurf());
    const small = window.matchMedia(SMALL_SCREEN);
    const motion = window.matchMedia(REDUCED_MOTION);
    small.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      small.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return canSurf;
}
