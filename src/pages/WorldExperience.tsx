import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PUBLISHED_PROJECTS, projectIndexById, type Project } from "../projects/projects";
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
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (openIndex >= 0) {
      setActive(openIndex);
      setEntered(true);
    }
  }, [openIndex]);

  const open = useCallback(
    (i: number) => {
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
      if (e.key === "ArrowRight") setActive((a) => Math.min(projects.length - 1, a + 1));
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

      {mode === "world" && entered && !panelOpen && (
        <TitleCard
          project={projects[active]}
          index={active}
          total={projects.length}
          onPrev={() => setActive((a) => Math.max(0, a - 1))}
          onNext={() => setActive((a) => Math.min(projects.length - 1, a + 1))}
          onOpen={() => open(active)}
        />
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
