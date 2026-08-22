import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "../router";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS, projectIndexById, type Project } from "../projects/projects";
import { INDIE_INDEX } from "../world/geometry";
import { useExperienceMode } from "../state/useExperienceMode";
import WorldNav from "../ui/WorldNav";
import EscapeHatch from "../ui/EscapeHatch";
import HeroIntro from "../ui/HeroIntro";
import ErrorBoundary from "../ui/ErrorBoundary";
import EggToast from "../ui/EggToast";
import SoundToggle from "../ui/SoundToggle";
import StoryCaption from "../ui/StoryCaption";
import SurfJourneyStatus from "../ui/SurfJourneyStatus";
import { readAvatar } from "../ui/avatars";
import type { Checkpoint } from "../world/surf-journey";
import { COIN_TOTAL, CHECKPOINT_TOTAL } from "../world/surf-journey";
import { CONTACT } from "../content/contact";
import { T, TYPE, textAccent } from "../theme";
import { sfx, startSurfMusic, stopSurfMusic } from "../audio/sfx";
import { useKeySequence, KONAMI, HIRE } from "../ui/hooks/useKeySequence";
import { markEggId } from "../state/progress";
import { EVENTS, track } from "../analytics/events";
import FlatMap from "./FlatMap";

// Lazy so three.js / r3f / drei only download on the interactive world path.
const World = lazy(() => import("../world/World"));
// Both mount behind a user gesture (opening a case study, answering the character
// gate), so their Suspense gap is invisible in practice and they stay out of the
// entry chunk. ProjectPanel drags the SVG viz layer with it.
const ProjectPanel = lazy(() => import("../ui/ProjectPanel"));
const AvatarSelect = lazy(() => import("../ui/AvatarSelect"));

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
  // Journey HUD: coins collected + the checkpoint card currently showing.
  const [coins, setCoins] = useState(0);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState<Set<number>>(() => new Set());
  // Finishing the run (all 42) earns the one real ask of the whole experience.
  // Once per visit: re-entering surf must not re-fire it.
  const [runComplete, setRunComplete] = useState(false);
  // Separate from `runComplete`, which the completion card clears when dismissed.
  // Finishing is permanent for the visit: a progress meter reading "42 / 42, 100%"
  // is just clutter reporting there is nothing left to do.
  const [runFinished, setRunFinished] = useState(false);
  const completedOnce = useRef(false);
  const onRunComplete = useCallback(() => {
    if (completedOnce.current) return;
    completedOnce.current = true;
    // Completion implies the full 42, so the totals add nothing; what matters is
    // that this visitor went all the way, and what they clicked next.
    track(EVENTS.surfRunCompleted);
    setRunComplete(true);
    setRunFinished(true);
    sfx.play("egg"); // the existing reward sound
  }, []);
  // The surf controls hint auto-hides (it eats real estate) after a few seconds
  // or the moment you start moving.
  const [surfHint, setSurfHint] = useState(true);
  // Playful "who's looking?" gate. Shown AFTER the hero (once you choose to
  // enter), not as the first screen. Fun label only — no story branching.
  const [avatar, setAvatar] = useState<string | null>(() => readAvatar());
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  // Park the render loop while the tab is backgrounded (no idle GPU/CPU heat).
  // Seeded from document.hidden rather than hardcoded true: visibilitychange only
  // fires on change, so a deep link cmd-clicked into a background tab (which mounts
  // the world immediately, since `entered` starts true) used to run a full
  // WebGLRenderer at 60fps in a tab nobody was looking at.
  const [visible, setVisible] = useState(() => !document.hidden);
  // Captured at first render and never updated: if the visit began on the hero,
  // the eventual World mount is an entrance and should dive. A deep link mounts
  // straight onto its island, so it must not.
  const diveOnMount = useRef(openIndex < 0).current;
  const opener = useRef<HTMLElement | null>(null);
  const prevActive = useRef(active);
  const suppressTravel = useRef(false);

  // Easter eggs. Konami → rainbow celebration; typing "hire" → a wink. Both
  // record the egg, which surfaces its reward toast (+ sound) via EggToast.
  useKeySequence(
    KONAMI,
    useCallback(() => {
      markEggId("konami");
      track(EVENTS.easterEggFound, { egg: "konami" });
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 1600);
    }, [])
  );
  useKeySequence(
    HIRE,
    useCallback(() => {
      markEggId("hire");
      track(EVENTS.easterEggFound, { egg: "hire" });
    }, [])
  );

  // Track tab visibility → drives the Canvas frameloop (parked when hidden).
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    onVis(); // close the gap between mount and listener attach
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Warm the three.js chunk while the visitor reads the hero. It is genuinely
  // lazy now (it used to be dragged onto the critical path by a chunking bug), so
  // without this the ENTER click would start a ~240 KB download behind a bare
  // loading string. Idle-time only, so it never competes with first paint.
  useEffect(() => {
    if (mode !== "world" || entered) return;
    const warm = () => void import("../world/World");
    const idle = window.requestIdleCallback?.(warm);
    const timer = idle === undefined ? window.setTimeout(warm, 1200) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [mode, entered]);

  // Free surf mode: hop on the board and roam the ocean; Esc comes back.
  const enterSurf = useCallback(() => {
    track(EVENTS.surfEntered);
    setSurfing(true);
    // Coins are NOT reset here: the run persists for the visit, and the
    // controller reports the resumed count on entry.
    setCheckpoint(null);
    setSurfHint(true);
    sfx.play("enter");
  }, []);

  // The Canvas parks (frameloop "never") while a panel is open, so no GPU burns
  // behind a full-height drawer. But "Next" moves the active island underneath
  // that drawer, and a parked loop means CameraRig never runs its spring: you
  // read the next case study with the previous monument still behind it, and
  // closing the panel left you looking at the island you had already finished.
  // Un-park for as long as the spring needs to arrive (~0.7s at STIFF 68 /
  // DAMP 12), then let it park again.
  const [travelling, setTravelling] = useState(false);
  useEffect(() => {
    if (!panelOpen) return;
    setTravelling(true);
    const t = setTimeout(() => setTravelling(false), 1200);
    return () => clearTimeout(t);
  }, [active, panelOpen]);

  const onSurfCheckpoint = useCallback((next: Checkpoint | null) => {
    setCheckpoint(next);
    if (next) {
      setVisitedCheckpoints((visited) => {
        if (visited.has(next.id)) return visited;
        const updated = new Set(visited);
        updated.add(next.id);
        return updated;
      });
    }
  }, []);

  // Hide the surf hint after a few seconds, or as soon as the surfer moves.
  useEffect(() => {
    if (!surfing) return;
    const timer = setTimeout(() => setSurfHint(false), 5000);
    const onMove = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) setSurfHint(false);
    };
    window.addEventListener("keydown", onMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onMove);
    };
  }, [surfing]);
  const exitSurf = useCallback(() => setSurfing(false), []);
  useEffect(() => {
    if (!surfing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSurfing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [surfing]);

  // The dreamy surf loop plays only in free-surf mode (covers enter, exit via
  // button/Esc, and unmount). Muting stops it from inside the audio layer.
  useEffect(() => {
    if (surfing) startSurfMusic();
    else stopSurfMusic();
    return () => stopSurfMusic();
  }, [surfing]);

  // Dive the camera into the world with a quick accent wash.
  const beginJourney = useCallback(() => {
    sfx.play("enter");
    track(EVENTS.worldEntered);
    setEntered(true);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 420);
  }, []);

  // Enter from the hero. First-time visitors pick a character next; returning
  // ones dive straight in. Sound stays off (default); the in-world toggle owns it.
  const onEnter = useCallback(() => {
    if (avatar === null) setChoosingAvatar(true);
    else beginJourney();
  }, [avatar, beginJourney]);

  const onPickAvatar = useCallback(
    (id: string) => {
      // Cosmetic label, but it is the visitor telling us who they are.
      track(EVENTS.avatarPicked, { avatar: id });
      setAvatar(id);
      setChoosingAvatar(false);
      beginJourney();
    },
    [beginJourney]
  );

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

  // One-time "how to interact" hint once you enter the world.
  useEffect(() => {
    if (mode !== "world" || !entered || panelOpen) return;
    if (sessionStorage.getItem("worldHint") === "1") return;
    setShowHint(true);
    const t = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem("worldHint", "1");
    }, 5000);
    return () => clearTimeout(t);
  }, [mode, entered, panelOpen]);

  const isIndie = active === INDIE_INDEX;
  // The hero owns the visible <h1> while it is up. Once it goes, nothing else in
  // the world carries one (the title card is a div, the panel starts at <h2>),
  // so the primary route was left with no top-level heading at all.
  const heroVisible = mode === "world" && !entered && !panelOpen && !choosingAvatar;

  const open = useCallback(
    (i: number) => {
      if (i >= projects.length) return; // indie island has no case study
      opener.current = document.activeElement as HTMLElement;
      suppressTravel.current = true; // this island-change is an open, not a travel
      sfx.play("open");
      track(EVENTS.caseStudyOpened, { project_id: projects[i].id, position: i + 1 });
      setActive(i); // keep the camera pointed at this island when the panel closes
      navigate(`/p/${projects[i].id}`);
    },
    [navigate, projects]
  );

  const close = useCallback(() => {
    sfx.play("close");
    track(EVENTS.caseStudyClosed, { project_id: projects[openIndex]?.id });
    navigate("/");
    requestAnimationFrame(() => opener.current?.focus?.());
  }, [navigate, openIndex, projects]);

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
    <main
      tabIndex={-1}
      style={{
        outline: "none",
        minHeight: "100vh",
        // Sky behind the transparent WebGL canvas. Dusk on the rail; a bright,
        // cheerful daytime while free-surfing (cross-fades with the 3D lighting).
        background: surfing ? T.daySky : T.sky,
        transition: "background 1s ease",
      }}
    >
      <Link to="/resume" className="skip-link">
        Skip to resume
      </Link>
      {/* Kept out of the visual design on purpose: the world says who this is
          through the scene, not a headline. Screen readers and crawlers still
          need the page to declare itself. */}
      {!heroVisible && mode === "world" && (
        <h1 className="sr-only">Utku Acikgoz, Senior Technical Product Manager, career world</h1>
      )}
      <EscapeHatch raised={heroVisible} />
      {/* Sound only exists inside the world (off by default, chosen at entry). */}
      {entered && <SoundToggle />}
      <EggToast />
      <WorldNav projects={projects} active={active} onFocus={setActive} onOpen={open} />

      {/* Static-until-enter: the heavy WebGL world (and three.js) mounts only once
          you enter (or deep-link a project). The bare landing stays pure DOM. */}
      {mode === "world" && (entered || panelOpen) ? (
        <ErrorBoundary area="world" fallback={<FlatMap projects={projects} onOpen={open} />}>
          <Suspense fallback={<WorldLoading />}>
            <World
              activeIndex={active}
              entered={entered}
              dive={diveOnMount}
              surfing={surfing}
              onOpen={open}
              onCoin={setCoins}
              onCheckpoint={onSurfCheckpoint}
              onComplete={onRunComplete}
              frameloop={visible && (!panelOpen || travelling) ? "always" : "never"}
            />
          </Suspense>
        </ErrorBoundary>
      ) : mode === "flat" ? (
        <FlatMap projects={projects} onOpen={open} />
      ) : null}

      {mode === "world" && choosingAvatar && !entered && (
        <Suspense fallback={null}>
          <AvatarSelect onPick={onPickAvatar} />
        </Suspense>
      )}

      {heroVisible && <HeroIntro onBegin={onEnter} />}

      {flashing && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 65,
            pointerEvents: "none",
            background: `radial-gradient(circle at 50% 45%, ${projects[active]?.accent ?? T.blue}, transparent 70%)`,
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
              `conic-gradient(from 0deg, ${T.blue}, ${T.gold}, ${T.seafoam}, ${T.mauve}, ${T.coral}, ${T.blue})`,
            animation: "konamiSweep 1.6s ease-out forwards",
          }}
        />
      )}

      {showHint && !panelOpen && !surfing && (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 45,
            padding: "8px 16px",
            background: T.scrimSoft,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            fontSize: TYPE.small,
            fontWeight: 600,
            color: T.textSoft,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            animation: "panelIn .4s ease",
          }}
        >
          ← → to travel · click a structure to open
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
          {active === projects.length - 1 && <button
            onClick={() => {
              track(EVENTS.indieShelfViewed, { source: "world_cta" });
              setActive(INDIE_INDEX);
            }}
            style={{
              position: "fixed",
              bottom: "calc(28px + env(safe-area-inset-bottom))",
              right: 24,
              zIndex: 44,
              padding: "11px 18px",
              background: T.scrim,
              border: `2px solid ${T.seafoam}`,
              color: T.seafoam,
              fontSize: TYPE.small,
              fontWeight: 800,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            🚀 What I'm building →
          </button>}
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
            background: T.scrim,
            border: `2px solid ${T.blue}`,
            color: textAccent(T.blue),
            fontSize: TYPE.small,
            fontWeight: 800,
            cursor: "pointer",
            backdropFilter: "blur(6px)",
          }}
        >
          🏄 Bonus: free surf
        </button>
      )}

      {mode === "world" && entered && !panelOpen && isIndie && !surfing && (
        <IndieOverlay onBack={() => setActive(INDIE_INDEX - 1)} />
      )}

      {mode === "world" && surfing && (
        <>
          {surfHint && (
            <div
              style={{
                position: "fixed",
                top: 76,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 45,
                padding: "8px 16px",
                background: T.scrimSoft,
                border: `1px solid ${T.border}`,
                borderRadius: 999,
                fontSize: TYPE.small,
                fontWeight: 600,
                color: T.textSoft,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              🏄 WASD to surf · Space to jump · Double Space for a 360 · Esc to come back
            </div>
          )}
          {/* Gone for good once the run is finished, not just while the completion
              card is up: dismissing that card used to bring the meter back reading
              "42 / 42 · 100%", which is a progress bar announcing there is no
              progress left to make. */}
          {!runFinished && <SurfJourneyStatus coins={coins} visited={visitedCheckpoints.size} />}
          {checkpoint && <CheckpointCard key={checkpoint.id} cp={checkpoint} />}
          {runComplete && (
            <RunCompleteCard
              onCases={() => {
                setRunComplete(false);
                exitSurf();
                open(0); // strongest-signal case study first (BiLira)
              }}
              onDismiss={() => setRunComplete(false)}
            />
          )}
          {/* Bottom right, not bottom center: the run-complete card owns the
              center and used to bury this button underneath it. */}
          <button
            onClick={exitSurf}
            style={{
              position: "fixed",
              bottom: "calc(24px + env(safe-area-inset-bottom))",
              right: 24,
              zIndex: 44,
              padding: "11px 20px",
              background: T.scrim,
              border: `2px solid ${T.blue}`,
              color: textAccent(T.blue),
              fontSize: TYPE.small,
              fontWeight: 800,
              cursor: "pointer",
              backdropFilter: "blur(6px)",
            }}
          >
            Exit surf
          </button>
        </>
      )}

      {panelOpen && (
        <Suspense fallback={null}>
        <ProjectPanel
          project={projects[openIndex]}
          onClose={close}
          nextTitle={openIndex === projects.length - 1 ? "What I'm building" : projects[openIndex + 1].title}
          onNext={() => {
            if (openIndex < projects.length - 1) open(openIndex + 1);
            else {
              navigate("/");
              setActive(INDIE_INDEX);
            }
          }}
        />
        </Suspense>
      )}
    </main>
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
        color: T.textMuted,
        fontSize: TYPE.body,
        fontWeight: 700,
        letterSpacing: 2,
      }}
    >
      BUILDING WORLD…
    </div>
  );
}

// A checkpoint you surf through pops a short "how I work" principle.
function CheckpointCard({ cp }: { cp: Checkpoint }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(92px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 45,
        width: "min(520px, calc(100vw - 32px))",
        padding: "16px 22px",
        background: T.scrimStrong,
        border: `2px solid ${cp.accent}`,
        borderRadius: 12,
        textAlign: "center",
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
        animation: "captionIn .45s ease",
      }}
    >
      <div style={{ fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 2, color: textAccent(cp.accent), marginBottom: 7 }}>
        🧭 HOW I WORK · {cp.id + 1} / {CHECKPOINT_TOTAL}
      </div>
      <div style={{ fontSize: TYPE.lead, fontWeight: 900, letterSpacing: 0.3, color: T.text, marginBottom: 6 }}>{cp.title}</div>
      <div style={{ fontSize: TYPE.body, fontWeight: 600, lineHeight: 1.5, color: T.textSoft }}>{cp.text}</div>
    </div>
  );
}

// Finishing the run is the one moment we know the visitor is engaged and out of
// things to collect. Rather than let them surf in circles forever, hand them the
// two things that actually matter: a call, or the work. Non-blocking on purpose,
// the ocean keeps running behind it and the card can be dismissed.
function RunCompleteCard({ onCases, onDismiss }: { onCases: () => void; onDismiss: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Run complete"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(28px + env(safe-area-inset-bottom))",
        transform: "translateX(-50%)",
        zIndex: 46,
        width: "min(560px, calc(100vw - 32px))",
        background: T.scrimStrong,
        border: `2px solid ${T.seafoam}`,
        borderRadius: 12,
        backdropFilter: "blur(8px)",
        padding: "20px 22px",
        textAlign: "center",
        animation: "captionIn .45s ease",
      }}
    >
      <div style={{ fontSize: TYPE.small, fontWeight: 800, letterSpacing: 1.5, color: T.seafoam, marginBottom: 8 }}>
        🏄 RUN COMPLETE · {COIN_TOTAL} / {COIN_TOTAL}
      </div>
      <div style={{ fontSize: TYPE.body, fontWeight: 700, lineHeight: 1.55, color: T.text, marginBottom: 16 }}>
        You surfed the whole loop and picked up every last coin. That is the same stubbornness I
        bring to shipping product. Want the real version?
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href={CONTACT.calendar}
          target="_blank"
          rel="noopener"
          onClick={() => track(EVENTS.ctaClicked, { cta: "book_call", location: "surf_run_complete" })}
          style={{
            padding: "12px 22px",
            background: T.seafoam,
            color: T.ink,
            fontSize: TYPE.body,
            fontWeight: 800,
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Book a 20 min call →
        </a>
        <button
          onClick={onCases}
          style={{
            padding: "12px 22px",
            background: "transparent",
            border: `2px solid ${T.seafoam}`,
            color: T.seafoam,
            fontSize: TYPE.body,
            fontWeight: 800,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          See the case studies
        </button>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          marginTop: 12,
          background: "none",
          border: "none",
          color: T.textMuted,
          fontSize: TYPE.small,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Keep surfing
      </button>
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
        background: T.scrimStrong,
        border: `2px solid ${T.seafoam}`,
        backdropFilter: "blur(8px)",
        padding: "20px 22px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: TYPE.small, fontWeight: 800, letterSpacing: 1.5, color: T.seafoam, marginBottom: 8 }}>
        🏄 WHAT I'M BUILDING
      </div>
      <p style={{ fontSize: TYPE.small, color: T.textSoft, lineHeight: 1.55, marginBottom: 16 }}>
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
              background: T.inkRaised,
              textAlign: "left",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.accent, flexShrink: 0 }} />
            <span style={{ fontWeight: 800, fontSize: TYPE.body }}>{p.title}</span>
            <span style={{ fontSize: TYPE.small, color: T.textMuted }}>{p.tagline}</span>
            <span style={{ marginLeft: "auto", fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 0.5, color: textAccent(p.accent) }}>
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
          border: `2px solid ${T.seafoam}`,
          color: T.seafoam,
          fontSize: TYPE.small,
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
        background: T.scrimStrong,
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
              background: i === index ? project.accent : T.surface,
              transition: "all .3s",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: TYPE.title, fontWeight: 900, letterSpacing: 0.5 }}>{project.title}</div>
      <div style={{ fontSize: TYPE.small, color: T.textMuted, margin: "6px 0 14px", lineHeight: 1.5 }}>
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
            color: T.ink,
            border: "none",
            fontSize: TYPE.small,
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
        border: `2px solid ${disabled ? T.surface : accent}`,
        color: disabled ? T.surface : accent,
        fontSize: TYPE.body,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
