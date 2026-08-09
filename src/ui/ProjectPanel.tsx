import { useEffect, useRef, useState } from "react";
import type { Project } from "../projects/projects";
import type { Beat } from "../content/types";
import { Metrics, Decisions, Initiatives, Stakeholders } from "./viz";
import { CONTACT } from "../content/contact";
import { markRead } from "../state/progress";
import { sfx } from "../audio/sfx";
import { EVENTS, track } from "../analytics/events";
import { T, TYPE, textAccent } from "../theme";

// Nice labels for the canonical arc, keyed by beat id so inserting a new beat
// (e.g. BiLira's "Stablecoin & DeFi") stays correctly labelled. A beat may also
// carry its own `label`.
const SECTION_LABELS: Record<string, string> = {
  problem: "Problem",
  constraints: "Constraints",
  approach: "Approach",
  results: "Results",
  learnings: "Learnings",
};

function beatLabel(b: Beat): string {
  return b.label ?? SECTION_LABELS[b.id] ?? b.id.charAt(0).toUpperCase() + b.id.slice(1);
}

const HEADER_H = 84; // sticky header height → scroll-padding + active-line offset

interface Props {
  project: Project;
  onClose: () => void;
  onNext?: () => void;
  nextTitle?: string;
}

/**
 * DOM overlay carrying a project's narrative beats + readable viz. Right-side
 * drawer on desktop, full-width on narrow viewports. Focus-trapped, Esc to close.
 *
 * One continuous column: you scroll normally within a section and snap gently to
 * the next (CSS scroll-snap). A sticky header (title, close, clickable progress)
 * stays pinned; the active section + read-stamp are driven by scroll position and
 * each section reveals as it enters. Colour follows 60/30/10 — dark chrome
 * dominates, neutral text carries the body, the accent is the sparing pop.
 */
export default function ProjectPanel({ project, onClose, onNext, nextTitle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const content = project.content;
  const [active, setActive] = useState(0);
  const readFired = useRef(false);

  useEffect(() => {
    readFired.current = false;
    setActive(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  // Reveal sections as they enter; track the active section from scroll position.
  useEffect(() => {
    if (!content) return;
    const root = scrollRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-beat]"));

    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) en.target.classList.add("revealed");
      },
      { root, threshold: 0.02, rootMargin: "0px 0px -8% 0px" }
    );
    sections.forEach((s) => revealIO.observe(s));

    let raf = 0;
    const computeActive = () => {
      raf = 0;
      const line = root.getBoundingClientRect().top + HEADER_H;
      let cur = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= line + 6) cur = i;
      });
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(computeActive);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    computeActive();
    return () => {
      revealIO.disconnect();
      root.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [content, project.id]);

  // Reaching the final section counts the study as read → ✓ stamp + chime.
  useEffect(() => {
    if (!content) return;
    if (active === content.beats.length - 1 && !readFired.current) {
      readFired.current = true;
      markRead(project.id);
      track(EVENTS.caseStudyRead, { project_id: project.id });
      sfx.play("read");
    }
  }, [active, content, project.id]);

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

  const jumpTo = (i: number) => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-beat="${i}"]`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  if (!content) {
    return (
      <Shell scrollRef={scrollRef} accent={project.accent} title={project.title}>
        <StickyHeader title={project.title} accent={project.accent} total={0} active={0} onClose={onClose} onJump={jumpTo} />
        <div style={{ padding: "26px clamp(20px, 5vw, 40px) calc(56px + env(safe-area-inset-bottom))" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: TYPE.micro,
              fontWeight: 800,
              letterSpacing: 1,
              color: T.ink,
              background: project.accent,
              padding: "4px 9px",
              borderRadius: 4,
              marginBottom: 18,
            }}
          >
            BUILDING NOW
          </span>
          <p style={{ color: T.text, fontSize: TYPE.lead, lineHeight: 1.6, marginBottom: 14 }}>{project.tagline}</p>
          {project.glimpse && <p style={{ color: T.textMuted, fontSize: TYPE.body, lineHeight: 1.7 }}>{project.glimpse}</p>}
          <CTA accent={project.accent} projectId={project.id} />
        </div>
      </Shell>
    );
  }

  const beats = content.beats;

  return (
    <Shell scrollRef={scrollRef} accent={project.accent} title={project.title}>
      <StickyHeader title={project.title} accent={project.accent} total={beats.length} active={active} onClose={onClose} onJump={jumpTo} />

      {beats.map((b, i) => {
        const label = beatLabel(b);
        const isLast = i === beats.length - 1;
        return (
          <section
            key={i}
            data-beat={i}
            className="beat-section"
            style={{ scrollSnapAlign: "start", padding: "30px clamp(20px, 5vw, 40px) 44px" }}
          >
            <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 1.5, color: textAccent(project.accent), marginBottom: 12 }}>
              {String(i + 1).padStart(2, "0")} / {String(beats.length).padStart(2, "0")} · {label.toUpperCase()}
            </div>
            <h3 style={{ color: T.text, fontSize: TYPE.display, fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>{label}</h3>

            {b.body.map((p, j) => (
              <p
                key={j}
                style={{
                  fontSize: TYPE.lead,
                  lineHeight: 1.7,
                  color: j === 0 ? T.text : T.textSoft,
                  marginBottom: 20,
                  maxWidth: "34em",
                }}
              >
                {j === 0 ? <Lead text={p} /> : p}
              </p>
            ))}

            {b.insight && <InsightCallout accent={project.accent} text={b.insight} />}
            {b.metrics && <Metrics metrics={b.metrics} />}
            {b.decisions && <Decisions decisions={b.decisions} accent={project.accent} />}
            {b.initiatives && <Initiatives initiatives={b.initiatives} accent={project.accent} />}
            {b.stakeholders && <Stakeholders stakeholders={b.stakeholders} accent={project.accent} />}

            {isLast && <CTA accent={project.accent} projectId={project.id} />}
            {isLast && onNext && nextTitle && (
              <button
                onClick={() => {
                  track(EVENTS.caseStudyAdvanced, { from_project_id: project.id, to: nextTitle });
                  onNext();
                }}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "14px 18px",
                  background: "transparent",
                  border: `2px solid ${project.accent}`,
                  color: textAccent(project.accent),
                  fontSize: TYPE.body,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                  cursor: "pointer",
                }}
              >
                Next: {nextTitle} →
              </button>
            )}
          </section>
        );
      })}
    </Shell>
  );
}

// Opens each beat with its first sentence emphasized — an at-a-glance takeaway
// so the panel skims instead of reading as a wall of text.
function Lead({ text }: { text: string }) {
  const cut = text.indexOf(". ");
  if (cut === -1) return <strong style={{ color: T.text, fontWeight: 800 }}>{text}</strong>;
  return (
    <>
      <strong style={{ color: T.text, fontWeight: 800 }}>{text.slice(0, cut + 1)}</strong>{" "}
      {text.slice(cut + 2)}
    </>
  );
}

function InsightCallout({ accent, text }: { accent: string; text: string }) {
  return (
    <div style={{ margin: "30px 0 6px", paddingLeft: 20, borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 2, color: textAccent(accent), marginBottom: 8 }}>THE INSIGHT</div>
      <p style={{ fontSize: TYPE.lead, lineHeight: 1.45, fontWeight: 800, color: T.text, letterSpacing: -0.2 }}>{text}</p>
    </div>
  );
}

function CTA({ accent, projectId }: { accent: string; projectId: string }) {
  return (
    <div style={{ marginTop: 36, padding: "26px 24px", background: `${accent}12`, border: `1.5px solid ${accent}`, borderRadius: 12 }}>
      <h3 style={{ fontSize: TYPE.title, fontWeight: 900, marginBottom: 8 }}>Like how I work?</h3>
      <p style={{ fontSize: TYPE.body, color: T.textSoft, lineHeight: 1.6, marginBottom: 20 }}>
        I'm open to senior product roles, and I build my own products on the side. If you want to talk, grab a slot or drop me a line.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={CONTACT.calendar}
          target="_blank"
          rel="noopener"
          onClick={() => track(EVENTS.ctaClicked, { cta: "book_call", location: "case_study", project_id: projectId })}
          style={{ padding: "12px 22px", background: accent, color: T.ink, fontSize: TYPE.body, fontWeight: 800, letterSpacing: 0.3 }}
        >
          Book a 20 min call →
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          onClick={() => track(EVENTS.ctaClicked, { cta: "email", location: "case_study", project_id: projectId })}
          style={{ padding: "12px 22px", border: `2px solid ${accent}`, color: textAccent(accent), fontSize: TYPE.body, fontWeight: 800 }}
        >
          Email me
        </a>
      </div>
    </div>
  );
}

// Pinned header: title, close, and a clickable progress bar that reflects + jumps
// to sections. Its background matches the drawer so sections scroll under it.
function StickyHeader({
  title,
  accent,
  total,
  active,
  onClose,
  onJump,
}: {
  title: string;
  accent: string;
  total: number;
  active: number;
  onClose: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        padding: "16px clamp(20px, 5vw, 40px) 14px",
        background: "rgba(29,24,22,0.94)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <h2 style={{ fontSize: TYPE.title, fontWeight: 900, letterSpacing: -0.3, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close case study"
          style={{
            flexShrink: 0,
            background: "transparent",
            border: `2px solid ${accent}`,
            color: textAccent(accent),
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: TYPE.body,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      {total > 1 && (
        <div role="tablist" aria-label="Case study sections" style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Section ${i + 1}`}
              onClick={() => onJump(i)}
              style={{ flex: 1, height: 4, padding: 0, border: "none", cursor: "pointer", background: i <= active ? accent : T.border }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Shell({
  scrollRef,
  accent,
  title,
  children,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  accent: string;
  title: string;
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
        width: "min(620px, 100vw)",
        background: "rgba(29,24,22,0.97)",
        backdropFilter: "blur(10px)",
        borderLeft: `3px solid ${accent}`,
        boxShadow: "-20px 0 60px rgba(0,0,0,0.6)",
        overflowY: "auto",
        scrollSnapType: "y proximity",
        scrollPaddingTop: HEADER_H,
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 60,
        outline: "none",
        animation: "panelIn .28s ease",
      }}
    >
      {children}
    </div>
  );
}
