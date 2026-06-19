import { useEffect, useRef, useState } from "react";
import type { Project } from "../projects/projects";
import { Metrics, Decisions, Initiatives, Stakeholders } from "./viz";
import { CONTACT } from "../content/contact";
import { markRead } from "../state/progress";

const SECTION_LABELS = ["Problem", "Constraints", "Approach", "Results", "Learnings"];

interface Props {
  project: Project;
  onClose: () => void;
}

/**
 * DOM overlay carrying a project's narrative beats + readable viz. Right-side
 * drawer on desktop, full-width on narrow viewports. Focus-trapped, Esc to close.
 * Scrolls back to top on every beat change for readability; final beat shows a CTA.
 */
export default function ProjectPanel({ project, onClose }: Props) {
  const [beat, setBeat] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const content = project.content;

  useEffect(() => setBeat(0), [project.id]);

  // Reaching the final beat (Learnings) counts the study as "read" → ✓ stamp.
  useEffect(() => {
    if (content && beat === content.beats.length - 1) markRead(project.id);
  }, [beat, content, project.id]);

  // Scroll the panel back to the top whenever the beat changes (respecting motion prefs).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [beat]);

  // Esc to close + trap Tab focus inside the dialog.
  useEffect(() => {
    scrollRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && scrollRef.current) {
        const f = scrollRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        const el = document.activeElement;
        if (!scrollRef.current.contains(el)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && el === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && el === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!content) {
    return (
      <Drawer scrollRef={scrollRef} accent={project.accent} onClose={onClose} title={project.title}>
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            color: "#000",
            background: project.accent,
            padding: "4px 9px",
            borderRadius: 4,
            marginBottom: 18,
          }}
        >
          BUILDING NOW
        </span>
        <p style={{ color: "#e7e9ee", fontSize: 18, lineHeight: 1.6, marginBottom: 14 }}>{project.tagline}</p>
        {project.glimpse && <p style={{ color: "#9aa0ac", fontSize: 15, lineHeight: 1.7 }}>{project.glimpse}</p>}
        <CTA accent={project.accent} />
      </Drawer>
    );
  }

  const beats = content.beats;
  const current = beats[beat];
  const label = SECTION_LABELS[beat] ?? current.id;
  const isLast = beat === beats.length - 1;

  return (
    <Drawer scrollRef={scrollRef} accent={project.accent} onClose={onClose} title={project.title} tagline={project.tagline}>
      {/* Progress */}
      <div role="tablist" aria-label="Case study sections" style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {beats.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === beat}
            aria-label={SECTION_LABELS[i] ?? `Beat ${i + 1}`}
            onClick={() => setBeat(i)}
            style={{
              flex: 1,
              height: 4,
              padding: 0,
              border: "none",
              cursor: "pointer",
              background: i <= beat ? project.accent : "#23283a",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#7f8694", marginBottom: 22 }}>
        {String(beat + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")} · {label.toUpperCase()}
      </div>

      <h3 style={{ color: project.accent, fontSize: 27, fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>{label}</h3>

      {current.body.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: 16,
            lineHeight: 1.85,
            color: i === 0 ? "#eceef2" : "#c4c8d2",
            marginBottom: 18,
          }}
        >
          {p}
        </p>
      ))}

      {current.insight && <InsightCallout accent={project.accent} text={current.insight} />}

      {current.metrics && <Metrics metrics={current.metrics} />}
      {current.decisions && <Decisions decisions={current.decisions} accent={project.accent} />}
      {current.initiatives && <Initiatives initiatives={current.initiatives} accent={project.accent} />}
      {current.stakeholders && <Stakeholders stakeholders={current.stakeholders} accent={project.accent} />}

      {isLast && <CTA accent={project.accent} />}

      {/* Beat nav */}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        <NavBtn accent={project.accent} disabled={beat === 0} onClick={() => setBeat((b) => Math.max(0, b - 1))}>
          ← Prev
        </NavBtn>
        <NavBtn accent={project.accent} disabled={isLast} onClick={() => setBeat((b) => Math.min(beats.length - 1, b + 1))}>
          Next →
        </NavBtn>
      </div>
    </Drawer>
  );
}

function InsightCallout({ accent, text }: { accent: string; text: string }) {
  return (
    <div style={{ margin: "30px 0 6px", paddingLeft: 20, borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2, color: accent, marginBottom: 8 }}>
        THE INSIGHT
      </div>
      <p style={{ fontSize: 19, lineHeight: 1.45, fontWeight: 800, color: "#eceef2", letterSpacing: -0.2 }}>
        {text}
      </p>
    </div>
  );
}

function CTA({ accent }: { accent: string }) {
  return (
    <div
      style={{
        marginTop: 36,
        padding: "26px 24px",
        background: `${accent}12`,
        border: `1.5px solid ${accent}`,
        borderRadius: 12,
      }}
    >
      <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Like how I work?</h3>
      <p style={{ fontSize: 14.5, color: "#c4c8d2", lineHeight: 1.6, marginBottom: 20 }}>
        I'm open to senior product roles, and I build my own products on the side. If you want to talk, grab a slot or drop me a line.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={CONTACT.calendar}
          target="_blank"
          rel="noopener"
          style={{
            padding: "12px 22px",
            background: accent,
            color: "#000",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 0.3,
          }}
        >
          Book a 20-min call →
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          style={{ padding: "12px 22px", border: `2px solid ${accent}`, color: accent, fontSize: 14, fontWeight: 800 }}
        >
          Email me
        </a>
      </div>
    </div>
  );
}

function Drawer({
  scrollRef,
  accent,
  onClose,
  title,
  tagline,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  onClose: () => void;
  title: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={scrollRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} case study`}
      tabIndex={-1}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100dvh",
        width: "min(580px, 100vw)",
        background: "rgba(7,8,12,0.97)",
        backdropFilter: "blur(10px)",
        borderLeft: `3px solid ${accent}`,
        boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
        padding: "72px clamp(20px, 5vw, 40px) calc(56px + env(safe-area-inset-bottom))",
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
      <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: tagline ? 8 : 24, letterSpacing: -0.5 }}>{title}</h2>
      {tagline && <p style={{ color: accent, fontSize: 14, fontWeight: 600, marginBottom: 28, lineHeight: 1.5 }}>{tagline}</p>}
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
        padding: "12px 16px",
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        background: "transparent",
        border: `2px solid ${disabled ? "#23283a" : accent}`,
        color: disabled ? "#23283a" : accent,
      }}
    >
      {children}
    </button>
  );
}
