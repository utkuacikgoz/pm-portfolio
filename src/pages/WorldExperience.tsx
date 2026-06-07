import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS, projectIndexById, type Project } from "../projects/projects";
import { INDIE_INDEX } from "../world/geometry";
import { useExperienceMode } from "../state/useExperienceMode";
import WorldNav from "../ui/WorldNav";
import EscapeHatch from "../ui/EscapeHatch";
import ProjectPanel from "../ui/ProjectPanel";
import HeroIntro from "../ui/HeroIntro";
import ErrorBoundary from "../ui/ErrorBoundary";
import FlatMap from "./FlatMap";

// Lazy so three.js / r3f / drei only download on the interactive world path.
const World = lazy(() => import("../world/World"));

export default function WorldExperience() {
  const mode = useExperienceMode();
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = PUBLISHED_PROJECTS;

  const openIndex = projectIndexById(id);
  const panelOpen = openIndex >= 0;
  const [active, setActive] = useState(() => Math.max(0, openIndex));
  // Intro shows first in world mode; deep-linking a project skips it.
  const [entered, setEntered] = useState(() => openIndex >= 0);
  const [showHint, setShowHint] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (openIndex >= 0) {
      setActive(openIndex);
      setEntered(true);
    }
  }, [openIndex]);

  // Per-route document title (helps shared links + crawlers that run JS).
  useEffect(() => {
    const base = "Utku Acikgoz — Senior Technical Product Manager";
    document.title = openIndex >= 0 ? `${projects[openIndex].title} — ${base}` : base;
  }, [openIndex, projects]);

  // One-time "how to interact" hint once you enter the world.
  useEffect(() => {
    if (mode !== "world" || !entered || panelOpen) return;
    if (sessionStorage.getItem("worldHint") === "1") return;
    setShowHint(true);
    const t = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem("worldHint", "1");
    }, 6000);
    return () => clearTimeout(t);
  }, [mode, entered, panelOpen]);

  const isIndie = active === INDIE_INDEX;

  const open = useCallback(
    (i: number) => {
      if (i >= projects.length) return; // indie island has no case study
      opener.current = document.activeElement as HTMLElement;
      navigate(`/p/${projects[i].id}`);
    },
    [navigate, projects]
  );

  const close = useCallback(() => {
    navigate("/");
    requestAnimationFrame(() => opener.current?.focus?.());
  }, [navigate]);

  // Arrow-key travel + Enter to open, for mouse users focused on the canvas/body.
  // Skipped when focus is on an interactive element (WorldNav handles its own keys).
  useEffect(() => {
    if (panelOpen || !entered) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") setActive((a) => Math.min(INDIE_INDEX, a + 1));
      else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, a - 1));
      else if (e.key === "Enter") open(active);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, entered, active, open, projects.length]);

  return (
    <div style={{ minHeight: "100vh", background: "#05060a" }}>
      <Link to="/resume" className="skip-link">
        Skip to résumé
      </Link>
      <EscapeHatch />
      <WorldNav projects={projects} active={active} onFocus={setActive} onOpen={open} />

      {mode === "world" ? (
        <ErrorBoundary fallback={<FlatMap projects={projects} onOpen={open} />}>
          <Suspense fallback={<WorldLoading />}>
            <World activeIndex={active} entered={entered} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <FlatMap projects={projects} onOpen={open} />
      )}

      {mode === "world" && !entered && !panelOpen && (
        <HeroIntro onBegin={() => setEntered(true)} />
      )}

      {showHint && (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 45,
            padding: "8px 16px",
            background: "rgba(7,8,12,0.8)",
            border: "1px solid #23283a",
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            color: "#c4c8d2",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            animation: "panelIn .4s ease",
          }}
        >
          Drag or Q/E to spin · ← → to travel · click a structure to open
        </div>
      )}

      {mode === "world" && entered && !panelOpen && !isIndie && (
        <>
          <TitleCard
            project={projects[active]}
            index={active}
            total={projects.length}
            onPrev={() => setActive((a) => Math.max(0, a - 1))}
            onNext={() => setActive((a) => Math.min(projects.length - 1, a + 1))}
            onOpen={() => open(active)}
          />
          <button
            onClick={() => setActive(INDIE_INDEX)}
            style={{
              position: "fixed",
              bottom: 28,
              right: 24,
              zIndex: 44,
              padding: "11px 18px",
              background: "rgba(7,8,12,0.85)",
              border: "2px solid #00E5A0",
              color: "#00E5A0",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            🏄 What I'm building →
          </button>
        </>
      )}

      {mode === "world" && entered && !panelOpen && isIndie && (
        <IndieOverlay onBack={() => setActive(INDIE_INDEX - 1)} />
      )}

      {panelOpen && <ProjectPanel project={projects[openIndex]} onClose={close} />}
    </div>
  );
}

function WorldLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7f8694",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: 2,
      }}
    >
      BUILDING WORLD…
    </div>
  );
}

function IndieOverlay({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 44,
        width: "min(560px, calc(100vw - 32px))",
        background: "rgba(7,8,12,0.92)",
        border: "2px solid #00E5A0",
        backdropFilter: "blur(8px)",
        padding: "20px 22px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, color: "#00E5A0", marginBottom: 8 }}>
        🏄 WHAT I'M BUILDING
      </div>
      <p style={{ fontSize: 13.5, color: "#c4c8d2", lineHeight: 1.55, marginBottom: 16 }}>
        53 countries travelled so far — here's what I'm building next. No case studies yet, just bets.
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {INDIE_PROJECTS.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              border: `1.5px solid ${p.accent}55`,
              background: "#0b0d14",
              textAlign: "left",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: 14 }}>{p.title}</span>
            <span style={{ fontSize: 12.5, color: "#9aa0ac" }}>{p.tagline}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: p.accent }}>
              COMING SOON
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onBack}
        style={{
          padding: "10px 20px",
          background: "transparent",
          border: "2px solid #00E5A0",
          color: "#00E5A0",
          fontSize: 13,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ← Surf back
      </button>
    </div>
  );
}

function TitleCard({
  project,
  index,
  total,
  onPrev,
  onNext,
  onOpen,
}: {
  project: Project;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 40,
        width: "min(520px, calc(100vw - 32px))",
        background: "rgba(7,8,12,0.9)",
        border: `2px solid ${project.accent}`,
        backdropFilter: "blur(6px)",
        padding: "16px 18px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 12 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              width: i === index ? 18 : 8,
              height: 8,
              background: i === index ? project.accent : "#2a2e3a",
              transition: "all .3s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.5 }}>{project.title}</div>
      <div style={{ fontSize: 12.5, color: "#9aa0ac", margin: "6px 0 14px", lineHeight: 1.5 }}>
        {project.tagline}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <ChevBtn accent={project.accent} disabled={index === 0} onClick={onPrev} label="Previous island">
          ←
        </ChevBtn>
        <button
          onClick={onOpen}
          style={{
            flex: 1,
            padding: "10px 16px",
            background: project.accent,
            color: "#000",
            border: "none",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 0.5,
          }}
        >
          OPEN CASE STUDY
        </button>
        <ChevBtn accent={project.accent} disabled={index === total - 1} onClick={onNext} label="Next island">
          →
        </ChevBtn>
      </div>
    </div>
  );
}

function ChevBtn({
  accent,
  disabled,
  onClick,
  label,
  children,
}: {
  accent: string;
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 44,
        padding: "10px 0",
        background: "transparent",
        border: `2px solid ${disabled ? "#2a2e3a" : accent}`,
        color: disabled ? "#2a2e3a" : accent,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
