import type { Project } from "../projects/projects";

interface Props {
  projects: Project[];
  onOpen: (index: number) => void;
}

/**
 * Lightweight fallback for mobile / reduced-motion / no-WebGL. Static iso-cube
 * "map" of the same islands, fully keyboard accessible. Imports NO three.js, so
 * the heavy 3D chunk never downloads on this path. Opens the same ProjectPanel.
 */
export default function FlatMap({ projects, onOpen }: Props) {
  return (
    <div style={{ minHeight: "100vh", padding: "88px 20px 64px", maxWidth: 920, margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(30px, 7vw, 40px)", fontWeight: 900 }}>Utku Acikgoz</h1>
        <p style={{ color: "#FF0080", fontSize: 16, fontWeight: 700, marginTop: 6 }}>
          Senior Technical Product Manager
        </p>
        <p style={{ color: "#7f8694", fontSize: 14, marginTop: 10 }}>
          Tap a structure to explore the case study.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {projects.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onOpen(i)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              background: "#0a0c12",
              border: `3px solid ${p.accent}`,
              padding: "22px 20px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              color: "#fff",
            }}
          >
            <IsoCube color={p.accent} />
            <span>
              <span style={{ display: "block", fontSize: 20, fontWeight: 900, letterSpacing: 0.5 }}>
                {p.title}
              </span>
              <span style={{ display: "block", fontSize: 12.5, color: "#9aa0ac", marginTop: 4, lineHeight: 1.5 }}>
                {p.tagline}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Simple flat-shaded iso cube glyph (matches the low-poly world aesthetic).
function IsoCube({ color }: { color: string }) {
  const shade = (hex: string, f: number) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return `rgb(${r},${g},${b})`;
  };
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" style={{ flexShrink: 0 }}>
      <polygon points="22,4 40,14 22,24 4,14" fill={shade(color, 1.15)} />
      <polygon points="4,14 22,24 22,42 4,32" fill={shade(color, 0.6)} />
      <polygon points="40,14 22,24 22,42 40,32" fill={shade(color, 0.85)} />
    </svg>
  );
}
