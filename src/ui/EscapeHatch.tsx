import { Link } from "../router";
import { EVENTS, track } from "../analytics/events";
import { T } from "../theme";

/**
 * Persistent "skip the world / see résumé" escape hatch. Always visible so a
 * recruiter who hates puzzles gets the goods in seconds.
 */
export default function EscapeHatch() {
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
        zIndex: 50,
        padding: "10px 18px",
        background: T.text,
        color: T.ink,
        fontSize: 13,
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
