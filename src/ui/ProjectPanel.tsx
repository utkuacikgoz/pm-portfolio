import { useEffect, useRef, useState } from "react";
import type { Project } from "../projects/projects";
import { MetricsBars, DecisionMatrix, EffortImpact, Stakeholders } from "./viz";

const SECTION_LABELS = ["Problem", "Constraints", "Approach", "Results", "Learnings"];

interface Props {
  project: Project;
  onClose: () => void;
}

/**
 * DOM overlay carrying a project's narrative beats + SVG viz. Shared by the
 * 3D world and the flat fallback → content parity for free. Right-side drawer
 * on desktop, full-width on narrow viewports. Focus-trapped, Esc to close.
 */
export default function ProjectPanel({ project, onClose }: Props) {
  const [beat, setBeat] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const content = project.content;

  // Reset to first beat whenever the project changes.
  useEffect(() => setBeat(0), [project.id]);

  // Esc to close + focus trap; focus the panel on open.
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!content) {
    return (
      <Drawer panelRef={panelRef} accent={project.accent} onClose={onClose} title={project.title}>
        <p style={{ color: "#9aa0ac", fontSize: 16 }}>{project.tagline}</p>
        <p style={{ color: "#7f8694", marginTop: 16 }}>Case study coming soon.</p>
      </Drawer>
    );
  }

  const beats = content.beats;
  const current = beats[beat];
  const label = SECTION_LABELS[beat] ?? current.id;

  return (
    <Drawer panelRef={panelRef} accent={project.accent} onClose={onClose} title={project.title} tagline={project.tagline}>
      {/* Beat stepper */}
      <div role="tablist" aria-label="Case study sections" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
        {beats.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === beat}
            onClick={() => setBeat(i)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: "pointer",
              color: i === beat ? "#000" : project.accent,
              background: i === beat ? project.accent : "transparent",
              border: `1.5px solid ${project.accent}`,
            }}
          >
            {SECTION_LABELS[i] ?? `Beat ${i + 1}`}
          </button>
        ))}
      </div>

      <h3 style={{ color: project.accent, fontSize: 24, fontWeight: 900, marginBottom: 18 }}>{label}</h3>

      {current.body.map((p, i) => (
        <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: "#d4d7de", marginBottom: 16 }}>
          {p}
        </p>
      ))}

      <div style={{ marginTop: 24 }}>
        {current.metrics && <MetricsBars metrics={current.metrics} />}
        {current.decisions && <DecisionMatrix decisions={current.decisions} accent={project.accent} />}
        {current.initiatives && <EffortImpact initiatives={current.initiatives} accent={project.accent} />}
        {current.stakeholders && <Stakeholders stakeholders={current.stakeholders} accent={project.accent} />}
      </div>

      {/* Beat nav */}
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <NavBtn accent={project.accent} disabled={beat === 0} onClick={() => setBeat((b) => Math.max(0, b - 1))}>
          ← Prev
        </NavBtn>
        <NavBtn accent={project.accent} disabled={beat === beats.length - 1} onClick={() => setBeat((b) => Math.min(beats.length - 1, b + 1))}>
          Next →
        </NavBtn>
      </div>
    </Drawer>
  );
}

function Drawer({
  panelRef,
  accent,
  onClose,
  title,
  tagline,
  children,
}: {
  panelRef: React.RefObject<HTMLDivElement>;
  accent: string;
  onClose: () => void;
  title: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} case study`}
      tabIndex={-1}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "min(560px, 100vw)",
        background: "rgba(7,8,12,0.96)",
        backdropFilter: "blur(8px)",
        borderLeft: `3px solid ${accent}`,
        boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
        padding: "72px 36px 48px",
        overflowY: "auto",
        zIndex: 60,
        outline: "none",
        animation: "panelIn .28s ease",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close case study"
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          background: "transparent",
          border: `2px solid ${accent}`,
          color: accent,
          width: 36,
          height: 36,
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <h2 style={{ fontSize: 34, fontWeight: 900, marginBottom: tagline ? 6 : 22 }}>{title}</h2>
      {tagline && <p style={{ color: accent, fontSize: 14, fontWeight: 600, marginBottom: 26 }}>{tagline}</p>}
      {children}
    </div>
  );
}

function NavBtn({
  accent,
  disabled,
  onClick,
  children,
}: {
  accent: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        background: "transparent",
        border: `2px solid ${disabled ? "#2a2e3a" : accent}`,
        color: disabled ? "#2a2e3a" : accent,
      }}
    >
      {children}
    </button>
  );
}
