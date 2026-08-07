import { useRef } from "react";
import { Link } from "../router";
import type { Project } from "../projects/projects";
import { INDIE_PROJECTS } from "../projects/projects";
import { useProgress, markEgg } from "../state/progress";
import { CONTACT } from "../content/contact";
import { EVENTS, track } from "../analytics/events";
import { T, textAccent } from "../theme";

interface Props {
  projects: Project[];
  onOpen: (index: number) => void;
}

/**
 * The mobile / reduced-motion / no-WebGL experience. Imports NO three.js, so the
 * heavy 3D chunk never downloads here. A designed page (not a bare fallback):
 * leads with positioning, carries the read-stamps + a hidden easter egg, and —
 * unlike before — gives mobile visitors a real contact funnel at the bottom.
 */
export default function FlatMap({ projects, onOpen }: Props) {
  const { read } = useProgress();

  // Hidden easter egg: 5 quick taps on the name (touch-reachable parity with the
  // desktop "click the surfer" trigger).
  const taps = useRef<number[]>([]);
  const onNameTap = () => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((t) => now - t < 1500);
    if (taps.current.length >= 5) {
      taps.current = [];
      markEgg();
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "72px 20px 56px", maxWidth: 920, margin: "0 auto" }}>
      <header style={{ textAlign: "center", marginBottom: 36 }}>
        <h1
          onClick={onNameTap}
          style={{ fontSize: "clamp(30px, 7vw, 40px)", fontWeight: 900, cursor: "default", userSelect: "none" }}
        >
          Utku Acikgoz
        </h1>
        <p style={{ color: textAccent(T.blue), fontSize: 16, fontWeight: 700, marginTop: 6 }}>
          Senior Technical Product Manager
        </p>
        <p style={{ color: T.textSoft, fontSize: 14, marginTop: 12, lineHeight: 1.7, maxWidth: 560, marginInline: "auto" }}>
          8+ years and 11 products shipped across fintech, blockchain, HRtech & SaaS. I lead distributed
          teams and lean hard on analytics and AI to ship.
        </p>
        <p style={{ color: T.textMuted, fontSize: 13, marginTop: 14 }}>
          Tap a project to read the case study.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {projects.map((p, i) => {
          const isRead = read.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onOpen(i)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                background: T.inkRaised,
                border: `3px solid ${p.accent}`,
                padding: "22px 20px",
                display: "flex",
                gap: 16,
                alignItems: "center",
                color: T.text,
                position: "relative",
              }}
            >
              {isRead && (
                <span
                  aria-label="read"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: textAccent(p.accent),
                  }}
                >
                  READ ✓
                </span>
              )}
              <IsoCube color={p.accent} />
              <span>
                <span style={{ display: "block", fontSize: 20, fontWeight: 900, letterSpacing: 0.5 }}>
                  {p.title}
                </span>
                <span style={{ display: "block", fontSize: 12.5, color: T.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                  {p.tagline}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {INDIE_PROJECTS.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.5, color: T.textMuted, margin: "40px 0 14px" }}>
            CURRENTLY BUILDING
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {INDIE_PROJECTS.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  background: T.inkRaised,
                  borderLeft: `4px solid ${p.accent}`,
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.accent, flexShrink: 0 }} />
                <span style={{ fontWeight: 800, fontSize: 15 }}>{p.title}</span>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>{p.glimpse ?? p.tagline}</span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: textAccent(p.accent),
                    whiteSpace: "nowrap",
                  }}
                >
                  COMING SOON
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* The mobile funnel — previously missing entirely. */}
      <div
        style={{
          marginTop: 44,
          padding: "26px 22px",
          background: `${T.blue}12`,
          border: `1.5px solid ${T.blue}`,
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Like how I work?</h2>
        <p style={{ fontSize: 14, color: T.textSoft, lineHeight: 1.6, marginBottom: 20 }}>
          Open to senior product roles, and building my own products on the side. Grab a slot or take the CV.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href={CONTACT.calendar}
            target="_blank"
            rel="noopener"
            onClick={() => track(EVENTS.ctaClicked, { cta: "book_call", location: "flat_map" })}
            style={{ padding: "12px 22px", background: T.blue, color: T.text, fontSize: 14, fontWeight: 800 }}
          >
            Book a 20 min call →
          </a>
          <a
            href="/UtkuAcikgoz-CV.pdf"
            download
            onClick={() => track(EVENTS.cvDownloaded, { location: "flat_map" })}
            style={{ padding: "12px 22px", border: `2px solid ${T.text}`, color: T.text, fontSize: 14, fontWeight: 800 }}
          >
            ↓ Download CV
          </a>
          <Link
            to="/resume"
            style={{ padding: "12px 22px", border: `2px solid ${T.mauve}`, color: T.mauve, fontSize: 14, fontWeight: 800 }}
          >
            Full resume
          </Link>
        </div>
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
