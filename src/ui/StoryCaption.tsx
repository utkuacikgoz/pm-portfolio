import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import type { Project } from "../projects/projects";

/**
 * Narrated fly-through caption. As the camera arrives at an island, a one-line
 * story beat fades in above the title card — a guided tour rather than a static
 * map. Parent keys this by project id so the fade replays on each arrival.
 */
export default function StoryCaption({ project }: { project: Project }) {
  const reduced = usePrefersReducedMotion();
  if (!project.story) return null;
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        top: "17%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 38,
        width: "min(680px, calc(100vw - 40px))",
        textAlign: "center",
        pointerEvents: "none",
        animation: reduced ? undefined : "captionIn .7s cubic-bezier(.22,.61,.36,1) both",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          color: project.accent,
          marginBottom: 8,
          textShadow: "0 2px 12px rgba(0,0,0,0.7)",
        }}
      >
        {project.title.toUpperCase()}
      </div>
      <p
        style={{
          fontSize: "clamp(18px, 3vw, 26px)",
          fontWeight: 800,
          lineHeight: 1.35,
          color: "#f2f4f8",
          textShadow: "0 2px 18px rgba(0,0,0,0.85)",
        }}
      >
        {project.story}
      </p>
    </div>
  );
}
