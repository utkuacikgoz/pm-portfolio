import { Link } from "react-router-dom";

/**
 * Persistent "skip the world / see résumé" escape hatch. Always visible so a
 * recruiter who hates puzzles gets the goods in seconds.
 */
export default function EscapeHatch() {
  return (
    <Link
      to="/resume"
      style={{
        position: "fixed",
        top: 20,
        right: 24,
        zIndex: 50,
        padding: "10px 18px",
        background: "#fff",
        color: "#000",
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 0.5,
        border: "2px solid #fff",
        textDecoration: "none",
      }}
    >
      RÉSUMÉ / SKIP →
    </Link>
  );
}
