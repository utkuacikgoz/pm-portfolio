import { Link } from "../router";
import { EVENTS, track } from "../analytics/events";
import { T, TYPE } from "../theme";

/**
 * Persistent "skip the world / see résumé" escape hatch. Always visible so a
 * recruiter who hates puzzles gets the goods in seconds.
 *
 * `raised` lifts it over the hero (z-index 70), which otherwise covers it. The
 * hero used to carry its own resume link underneath the CTA; now that it does
 * not, this is the only resume affordance on the landing screen and it has to
 * be on top. It stays at 50 everywhere else, deliberately UNDER the case-study
 * drawer (60), which is meant to cover it.
 */
export default function EscapeHatch({ raised = false }: { raised?: boolean }) {
  return (
    <Link
      to="/resume"
      // Bailing out of the world is a signal in itself: how many visitors never
      // wanted the 3D at all.
      onClick={() => track(EVENTS.ctaClicked, { cta: "resume", location: "escape_hatch" })}
      style={{
        position: "fixed",
        top: 20,
        right: 24,
        zIndex: raised ? 71 : 50,
        // 44px is the touch-target minimum; it rendered at 41.
        display: "inline-flex",
        alignItems: "center",
        minHeight: 44,
        padding: "10px 18px",
        background: T.text,
        color: T.ink,
        fontSize: TYPE.small,
        fontWeight: 800,
        letterSpacing: 0.5,
        border: `2px solid ${T.text}`,
        textDecoration: "none",
      }}
    >
      RESUME →
    </Link>
  );
}
