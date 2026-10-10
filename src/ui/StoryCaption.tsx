import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import { formatHeadline } from "../projects/projects";
import type { Headline, Project } from "../projects/projects";
import { T, TYPE, textAccent } from "../theme";

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
        top: "3%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 38,
        width: "min(860px, calc(100vw - 24px))",
        padding: "26px 32px 46px",
        textAlign: "center",
        pointerEvents: "none",
        // Half-elliptic scrim so the title/description never vanish into the world.
        background:
          "radial-gradient(120% 130% at 50% 0%, rgba(29,24,22,0.78) 0%, rgba(29,24,22,0.44) 42%, transparent 72%)",
        animation: reduced ? undefined : "captionIn .7s cubic-bezier(.22,.61,.36,1) both",
      }}
    >
      <div
        style={{
          fontSize: TYPE.micro,
          fontWeight: 800,
          letterSpacing: 2,
          color: textAccent(project.accent),
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
          color: T.text,
          textShadow: "0 2px 18px rgba(0,0,0,0.85)",
        }}
      >
        {project.story}
      </p>
      {project.headline && <HeadlineCount key={project.id} headline={project.headline} accent={project.accent} reduced={reduced} />}
    </div>
  );
}

const COUNT_DELAY_MS = 450; // let the camera land first
const COUNT_MS = 1100;

/**
 * The island's one number, counting from its "before" to its result. Written
 * straight to the node per frame, so a count never re-renders the overlay.
 * Screen readers get the final figure once, not every tick.
 */
function HeadlineCount({ headline, accent, reduced }: { headline: Headline; accent: string; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = formatHeadline(headline);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const from = headline.from ?? 0;
    let raf = 0;
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now + COUNT_DELAY_MS;
      const p = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = formatHeadline(headline, from + (headline.to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    el.textContent = formatHeadline(headline, from);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [headline, reduced]);
  return (
    <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
      <span aria-hidden="true" style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 900, lineHeight: 1, color: textAccent(accent), fontVariantNumeric: "tabular-nums", textShadow: "0 2px 18px rgba(0,0,0,0.85)" }}>
        <span ref={ref}>{final}</span>
      </span>
      <span style={{ fontSize: TYPE.body, fontWeight: 700, color: T.textSoft, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{final} </span>
        {headline.label}
      </span>
    </div>
  );
}
