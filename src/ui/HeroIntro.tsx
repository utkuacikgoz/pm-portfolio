import { Link } from "react-router-dom";

/**
 * Opening identity beat — shown first, over the camera's wide establishing shot.
 * Answers "who is this / what do they do" before any project. "Begin" flies the
 * camera into the world; résumé escape hatch is always one click away.
 */
export default function HeroIntro({ onBegin }: { onBegin: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Introduction"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 50% 38%, rgba(5,6,10,0.5), rgba(5,6,10,0.93))",
        animation: "panelIn .4s ease",
      }}
    >
      <p style={{ letterSpacing: 5, fontSize: 12, fontWeight: 700, color: "#7f8694", marginBottom: 16 }}>
        UTKU ACIKGOZ
      </p>
      <h1 style={{ fontSize: "clamp(40px, 8vw, 82px)", fontWeight: 900, lineHeight: 1.05, maxWidth: 900 }}>
        Senior Technical
        <br />
        Product Manager
      </h1>
      <p
        style={{
          fontSize: "clamp(15px, 2.5vw, 19px)",
          color: "#cfd3dc",
          marginTop: 20,
          maxWidth: 600,
          lineHeight: 1.6,
        }}
      >
        8+ years across fintech, blockchain, HRtech & SaaS. 11 products shipped.
        Explore the work as a world — each island is a product I built.
      </p>
      <button
        onClick={onBegin}
        autoFocus
        style={{
          marginTop: 36,
          padding: "16px 34px",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 1,
          background: "#FF0080",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        BEGIN THE JOURNEY ▸
      </button>
      <Link
        to="/resume"
        style={{ marginTop: 18, fontSize: 13, fontWeight: 700, color: "#9aa0ac", textDecoration: "underline" }}
      >
        or skip straight to the résumé
      </Link>
    </div>
  );
}
