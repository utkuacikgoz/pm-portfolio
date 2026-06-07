import { Link } from "react-router-dom";
import { PUBLISHED_PROJECTS } from "../projects/projects";

const CONTACTS = [
  { label: "EMAIL", href: "mailto:hello@utkuacikgoz.com", color: "#FFD700" },
  { label: "LINKEDIN", href: "https://linkedin.com/in/utkuacikgoz", color: "#FF0080" },
  { label: "WEBSITE", href: "https://utkuacikgoz.com", color: "#00FFFF" },
];

/**
 * The <30s escape hatch: fast, plain-DOM résumé. No 3D, no animation. Skimmable
 * outcomes with deep links into each case study.
 */
export default function Resume() {
  return (
    <div style={{ minHeight: "100vh", padding: "64px 24px 96px", maxWidth: 800, margin: "0 auto" }}>
      <Link
        to="/"
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          padding: "10px 18px",
          border: "2px solid #fff",
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        ← EXPLORE THE WORLD
      </Link>

      <header style={{ marginTop: 24, marginBottom: 12 }}>
        <h1 style={{ fontSize: "clamp(34px, 8vw, 48px)", fontWeight: 900 }}>Utku Acikgoz</h1>
        <p style={{ color: "#FF0080", fontSize: 18, fontWeight: 700, marginTop: 6 }}>
          Senior Technical Product Manager
        </p>
        <p style={{ color: "#9aa0ac", fontSize: 15, marginTop: 12, lineHeight: 1.7 }}>
          8+ years across fintech, blockchain, HRtech and SaaS. 11 products shipped — regulated-scale
          platforms, 0→1 transformations, and the teams behind them.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20 }}>
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener" : undefined}
              style={{ padding: "8px 16px", border: `2px solid ${c.color}`, color: c.color, fontSize: 13, fontWeight: 700 }}
            >
              {c.label}
            </a>
          ))}
        </div>
      </header>

      <h2 style={{ fontSize: 20, fontWeight: 900, margin: "40px 0 18px", letterSpacing: 1 }}>
        SELECTED WORK
      </h2>
      <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>
        {PUBLISHED_PROJECTS.map((p) => (
          <li key={p.id}>
            <Link
              to={`/p/${p.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                background: "#0a0c12",
                borderLeft: `4px solid ${p.accent}`,
                color: "#fff",
              }}
            >
              <span>
                <span style={{ display: "block", fontSize: 18, fontWeight: 800 }}>{p.title}</span>
                <span style={{ display: "block", fontSize: 13, color: "#9aa0ac", marginTop: 3 }}>{p.tagline}</span>
              </span>
              <span style={{ color: p.accent, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>VIEW →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
