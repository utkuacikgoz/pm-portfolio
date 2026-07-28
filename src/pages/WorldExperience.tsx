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
import EggToast from "../ui/EggToast";
import SoundToggle from "../ui/SoundToggle";
import StoryCaption from "../ui/StoryCaption";
import AvatarSelect from "../ui/AvatarSelect";
import { readAvatar } from "../ui/avatars";
import type { SurfSpot } from "../world/surf-spots";
import { sfx, armAudio } from "../audio/sfx";
import { useKeySequence, KONAMI, HIRE } from "../ui/hooks/useKeySequence";
import { markEggId } from "../state/progress";
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
  const [flashing, setFlashing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [surfing, setSurfing] = useState(false);
  // The legendary break the surfer is nearest to (or null in open water) — driven
  // by SurfController, surfaced as a small DOM HUD label while surfing.
  const [nearSpot, setNearSpot] = useState<SurfSpot | null>(null);
  // Playful "who's looking?" gate, shown once before the experience (skipped on
  // deep links). Fun label only — surfaces as a small badge, no story branching.
  const [avatar, setAvatar] = useState<string | null>(() => readAvatar());
  const needAvatar = avatar === null && openIndex < 0;
  const opener = useRef<HTMLElement | null>(null);
  const prevActive = useRef(active);
  const suppressTravel = useRef(false);

  // Easter eggs. Konami → rainbow celebration; typing "hire" → a wink. Both
  // record the egg, which surfaces its reward toast (+ sound) via EggToast.
  useKeySequence(
    KONAMI,
    useCallback(() => {
      markEggId("konami");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1600);
    }, [])
  );
  useKeySequence(
    HIRE,
    useCallback(() => markEggId("hire"), [])
  );

  // Sound is on by default; start the waterfall on the first user gesture.
  useEffect(() => armAudio(), []);

  // Free surf mode: hop on the board and roam the ocean; Esc comes back.
  const enterSurf = useCallback(() => {
    setSurfing(true);
    sfx.play("enter");
  }, []);
  const exitSurf = useCallback(() => setSurfing(false), []);
  useEffect(() => {
    if (!surfing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSurfing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [surfing]);

  // Begin: punctuate the camera dive with a quick accent wash, then enter.
  const beginJourney = useCallback(() => {
    sfx.play("enter");
    setEntered(true);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 420);
  }, []);

  // Whoosh when travelling between islands — but not when a click opened one
  // (that gets its own "open" sound) and not on the initial mount.
  useEffect(() => {
    const changed = prevActive.current !== active;
    prevActive.current = active;
    if (!changed) return;
    if (suppressTravel.current) {
      suppressTravel.current = false;
      return;
    }
    if (entered && !panelOpen) sfx.play("travel");
  }, [active, entered, panelOpen]);

  useEffect(() => {
    if (openIndex >= 0) {
      setActive(openIndex);
      setEntered(true);
    }
  }, [openIndex]);

  // Per-route document title (helps shared links + crawlers that run JS).
  useEffect(() => {
    const base = "Utku Acikgoz, Senior Technical Product Manager";
    document.title = openIndex >= 0 ? `${projects[openIndex].title} | ${base}` : base;
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
      suppressTravel.current = true; // this island-change is an open, not a travel
      sfx.play("open");
      setActive(i); // keep the camera pointed at this island when the panel closes
      navigate(`/p/${projects[i].id}`);
    },
    [navigate, projects]
  );

  const close = useCallback(() => {
    sfx.play("close");
    navigate("/");
    requestAnimationFrame(() => opener.current?.focus?.());
  }, [navigate]);

  // Arrow-key travel + Enter to open, for mouse users focused on the canvas/body.
  // Skipped when focus is on an interactive element (WorldNav handles its own keys).
  useEffect(() => {
    if (panelOpen || !entered || surfing) return; // surf mode owns the arrows
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["BUTTON", "A", "INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") setActive((a) => Math.min(INDIE_INDEX, a + 1));
      else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, a - 1));
      else if (e.key === "Enter") open(active);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, entered, surfing, active, open, projects.length]);

  return (
    <div
      style={{
        minHeight: "100vh",
        // Tropical-dusk sky: shows through the transparent WebGL canvas as the
        // backdrop. Deep indigo up top → teal → warm turquoise at the horizon.
        background:
          "linear-gradient(180deg, #0a0e24 0%, #0f2a3f 44%, #14495a 74%, #1f6f74 100%)",
      }}
    >
      <Link to="/resume" className="skip-link">
        Skip to resume
      </Link>
      <EscapeHatch />
      <SoundToggle />
      <EggToast />
      <WorldNav projects={projects} active={active} onFocus={setActive} onOpen={open} />

      {mode === "world" ? (
        <ErrorBoundary fallback={<FlatMap projects={projects} onOpen={open} />}>
          <Suspense fallback={<WorldLoading />}>
            <World activeIndex={active} entered={entered} surfing={surfing} onOpen={open} onNearSpot={setNearSpot} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <FlatMap projects={projects} onOpen={open} />
      )}

      {needAvatar && <AvatarSelect onPick={setAvatar} />}

      {mode === "world" && !entered && !panelOpen && !needAvatar && (
        <HeroIntro onBegin={beginJourney} />
      )}

      {flashing && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 65,
            pointerEvents: "none",
            background: `radial-gradient(circle at 50% 45%, ${projects[active]?.accent ?? "#FF0080"}, transparent 70%)`,
            animation: "diveFlash .42s ease-out forwards",
          }}
        />
      )}

      {celebrate && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 75,
            pointerEvents: "none",
            mixBlendMode: "screen",
            background:
              "conic-gradient(from 0deg, #FF0080, #FFD700, #00FF88, #00FFFF, #FF6B35, #FF0080)",
            animation: "konamiSweep 1.6s ease-out forwards",
          }}
        />
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

      {mode === "world" && entered && !panelOpen && !isIndie && !surfing && (
        <>
          <StoryCaption key={projects[active].id} project={projects[active]} />
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
              bottom: "calc(28px + env(safe-area-inset-bottom))",
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
            🚀 What I'm building →
          </button>
        </>
      )}

      {mode === "world" && entered && !panelOpen && !surfing && (
        <button
          onClick={enterSurf}
          aria-label="Enter free surf mode"
          style={{
            position: "fixed",
            top: 20,
            left: 24,
            zIndex: 44,
            padding: "10px 16px",
            background: "rgba(7,8,12,0.85)",
            border: "2px solid #00CFFF",
            color: "#00CFFF",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            backdropFilter: "blur(6px)",
          }}
        >
          🏄 Free surf
        </button>
      )}

      {mode === "world" && entered && !panelOpen && isIndie && !surfing && (
        <IndieOverlay onBack={() => setActive(INDIE_INDEX - 1)} />
      )}

      {mode === "world" && surfing && (
        <>
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
            }}
          >
            🏄 WASD or arrows to surf · Esc to come back
          </div>
          {nearSpot && <SpotLabel key={nearSpot.id} spot={nearSpot} />}
          <button
            onClick={exitSurf}
            style={{
              position: "fixed",
              bottom: "calc(28px + env(safe-area-inset-bottom))",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 44,
              padding: "11px 20px",
              background: "rgba(7,8,12,0.85)",
              border: "2px solid #00CFFF",
              color: "#00CFFF",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            Exit surf
          </button>
        </>
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

// Names the legendary break the surfer has reached — appears/updates as you roam
// between spots. Purely a label; the landmark itself lives in the 3D scene.
function SpotLabel({ spot }: { spot: SurfSpot }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 120,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 45,
        width: "min(440px, calc(100vw - 32px))",
        padding: "14px 20px",
        background: "rgba(7,8,12,0.86)",
        border: `2px solid ${spot.accent}`,
        borderRadius: 12,
        textAlign: "center",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
        animation: "captionIn .45s ease",
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 2, color: spot.accent, marginBottom: 5 }}>
        🌊 LEGENDARY BREAK
      </div>
      <div style={{ fontSize: 25, fontWeight: 900, letterSpacing: 0.4, color: "#fff", marginBottom: 4 }}>
        {spot.name}
      </div>
      <div style={{ fontSize: 12.5, color: "#c4c8d2", lineHeight: 1.5 }}>{spot.blurb}</div>
    </div>
  );
}

function IndieOverlay({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(28px + env(safe-area-inset-bottom))",
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
        53 countries travelled so far. Here's what I'm building next. No case studies yet, just bets.
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
        bottom: "calc(28px + env(safe-area-inset-bottom))",
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
