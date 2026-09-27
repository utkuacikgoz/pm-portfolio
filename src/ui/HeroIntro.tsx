import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import { CTA_STAGE, stageTransform } from "./reel/stage";
import { T, TYPE } from "../theme";

type Reel = typeof import("./reel/drawReel");

/**
 * "static": the plain DOM hero (a return visit this session, reduced motion,
 * or the fonts/reel did not arrive in time). "loading": the reel is on its way
 * and the canvas holds the background. "playing": the canvas owns the frame,
 * through the 15 s reel and then as the resting hero.
 */
type Phase = "static" | "loading" | "playing";

const SEEN_KEY = "reel:seen";
const FONT_TIMEOUT_MS = 1500;
const REEL_FONTS = ["400 22px", "600 28px", "700 20px", "800 100px"];
const MAX_STEP_MS = 50;
const SKIP_SPEED = 2;

// One attempt per page load even if sessionStorage is unavailable.
let attempted = false;

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: `attempted` still keeps it to once per load.
  }
}

/** The reel needs the Font Loading API and a 2D canvas (jsdom has neither). */
function canPlay(): boolean {
  return typeof document !== "undefined" && "fonts" in document && typeof HTMLCanvasElement !== "undefined";
}

/** Visually hidden, still read by screen readers and crawlers. */
const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * Opening identity beat. The first visit of a session plays "The Datum", a
 * 15 s Canvas2D reel (src/ui/reel) that states the name, the title, the proof
 * and the five products with their real numbers, then comes to rest as this
 * exact hero. It is the pitch, not a gate: ENTER and RESUME are live from the
 * first frame, and SKIP, Esc or a click on the stage cut to the summary.
 *
 * The canvas is 2D, never WebGL, so three.js still only downloads once someone
 * commits to entering (CLAUDE.md, entrance flow), and the reel module itself is
 * fetched in parallel with the fonts rather than riding in the entry chunk.
 *
 * The DOM copy below is always rendered. While the canvas owns the frame it is
 * visually hidden, so the heading, the line and the stats stay the page's real
 * semantics for screen readers and for the prerendered no-JS page.
 */
export default function HeroIntro({ onBegin }: { onBegin: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>(() =>
    reduced || attempted || !canPlay() || seenThisSession() ? "static" : "loading",
  );
  // True once the reel reaches its resting frame: hides SKIP, starts the CTA breathe.
  const [atRest, setAtRest] = useState(false);
  const [stage, setStage] = useState(() => stageTransform(window.innerWidth, window.innerHeight));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reelRef = useRef<Reel | null>(null);
  const skipRef = useRef<() => void>(() => {});

  // Reduced motion switched on mid-reel: drop to the static hero.
  useEffect(() => {
    if (reduced && phase !== "static") setPhase("static");
  }, [reduced, phase]);

  // Fonts first, raced against a timeout. Measuring the fallback face would put
  // every glyph in the wrong place, so a miss means the static hero, never a
  // reel in the wrong font.
  useEffect(() => {
    if (phase !== "loading") return;
    attempted = true;
    let cancelled = false;
    let timer = 0;
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error("reel fonts timed out")), FONT_TIMEOUT_MS);
    });
    const ready = Promise.all([
      import("./reel/drawReel"),
      ...REEL_FONTS.map((f) => document.fonts.load(`${f} "Plus Jakarta Sans"`)),
    ]);
    Promise.race([ready, timeout])
      .then(([reel]) => {
        if (cancelled) return;
        reelRef.current = reel;
        markSeen();
        setPhase("playing");
      })
      .catch(() => {
        if (!cancelled) setPhase("static");
      })
      .finally(() => clearTimeout(timer));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phase]);

  // The DOM button rides on the stage, so it tracks the viewport like the canvas.
  useEffect(() => {
    if (phase === "static") return;
    const onResize = () => setStage(stageTransform(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [phase]);

  // The clock. Deltas are capped, so a backgrounded tab resumes where it left
  // off instead of jumping ahead.
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    const reel = reelRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !reel || !ctx) {
      setPhase("static");
      return;
    }
    let w = 0;
    let h = 0;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    fit();
    reel.prepareReel(ctx);

    let t = 0;
    let speed = 1;
    let last = -1;
    let raf = 0;
    let rested = false;
    const paint = () => {
      reel.drawReel(ctx, t, w, h);
      if (!rested && t >= reel.REEL_REST) {
        rested = true;
        setAtRest(true);
      }
    };
    const frame = (now: number) => {
      if (last >= 0) t = Math.min(reel.REEL_DURATION, t + (Math.min(MAX_STEP_MS, now - last) / 1000) * speed);
      last = now;
      paint();
      raf = t < reel.REEL_DURATION ? requestAnimationFrame(frame) : 0;
    };
    raf = requestAnimationFrame(frame);

    // First skip cuts to the complete ledger and plays the resolve at 2x; a
    // second one lands on the resting frame.
    skipRef.current = () => {
      if (t >= reel.REEL_DURATION) return;
      if (speed > 1) t = reel.REEL_DURATION;
      else {
        t = Math.max(t, reel.SKIP_TARGET);
        speed = SKIP_SPEED;
      }
      if (!raf) paint();
    };
    // Enter, Space and Tab stay with the focused CTA; only Escape skips.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipRef.current();
    };
    const onResize = () => {
      fit();
      if (!raf) paint();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      skipRef.current = () => {};
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [phase]);

  const onStage = phase !== "static";
  const animate = !reduced && !onStage;
  const rise = (delay: number): React.CSSProperties =>
    animate ? { animation: `heroRise .7s cubic-bezier(.22,.61,.36,1) both`, animationDelay: `${delay}s` } : {};
  const hidden = onStage ? SR_ONLY : null;
  const ctaGlow = reduced || (onStage && !atRest) ? undefined : `ctaGlow 2.8s ease-in-out ${onStage ? 0 : 1.8}s infinite`;

  const cta = <MagneticCTA reduced={reduced} onClick={onBegin} glow={ctaGlow} rise={onStage ? undefined : rise(0.9)} />;

  return (
    <div
      role="dialog"
      aria-label="Introduction"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        overflow: "hidden",
        // Entrance stays black (Utku's call): opaque black base with a faint
        // coral/periwinkle glow (logo palette). The reel paints this same
        // recipe (src/ui/reel/cache.ts), so the hand-over is invisible.
        background: `radial-gradient(120% 80% at 50% 8%, ${T.entranceGlow.coral}, transparent 46%), radial-gradient(120% 80% at 50% 100%, ${T.entranceGlow.blue}, transparent 52%), radial-gradient(circle at 50% 42%, ${T.inkRaised} 0%, ${T.ink} 62%, #0C0A09 100%)`,
        textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
      }}
    >
      {onStage && (
        <canvas
          ref={canvasRef}
          aria-hidden
          onPointerDown={() => skipRef.current()}
          style={{ position: "fixed", inset: 0, width: "100%", height: "100%", display: "block" }}
        />
      )}

      <img src="/utku-logo.svg" alt="" width={56} height={56} style={{ marginBottom: 26, ...rise(0), ...hidden }} />
      <p
        style={{
          letterSpacing: 5,
          fontSize: TYPE.small,
          fontWeight: 700,
          color: T.textMuted,
          marginBottom: 16,
          ...rise(0.1),
          ...hidden,
        }}
      >
        UTKU ACIKGOZ
      </p>
      <h1 style={{ fontSize: "clamp(40px, 8vw, 82px)", fontWeight: 900, lineHeight: 1.05, ...rise(0.2), ...hidden }}>
        {/* Block spans for the two lines, with a real space between them so the
            heading's text content reads "Senior Technical Product Manager". */}
        <span style={{ display: "block" }}>Senior Technical</span>{" "}
        <span style={{ display: "block" }}>Product Manager</span>
      </h1>

      {/* One supporting line, not three: the CTA is the only thing asking to be clicked. */}
      <p
        style={{
          fontSize: "clamp(17px, 2.8vw, 22px)",
          color: T.textSoft,
          marginTop: 26,
          maxWidth: 660,
          lineHeight: 1.65,
          ...rise(0.74),
          ...hidden,
        }}
      >
        I lead teams building complex products, from fintech infrastructure to AI features for marketplaces.
      </p>

      <ProofRow style={{ ...rise(0.82), ...hidden }} />

      {onStage ? (
        <div
          style={{
            position: "absolute",
            left: stage.ox + CTA_STAGE.cx * stage.s,
            top: stage.oy + CTA_STAGE.cy * stage.s,
            transform: `translate(-50%, -50%) scale(${Math.max(stage.s, 0.85)})`,
          }}
        >
          {cta}
        </div>
      ) : (
        cta
      )}

      {phase === "playing" && !atRest && (
        <button
          type="button"
          onClick={() => skipRef.current()}
          style={{
            position: "fixed",
            right: 24,
            bottom: 20,
            fontSize: TYPE.small,
            fontWeight: 800,
            letterSpacing: 1,
            color: T.textMuted,
            background: "transparent",
            border: `1px solid ${T.border}`,
            padding: "8px 14px",
            cursor: "pointer",
            textShadow: "none",
          }}
        >
          SKIP
        </button>
      )}
    </div>
  );
}

// ── Proof metrics: recruiter-skimmable numbers ────────────────────────────────
const STATS: { value: string; label: string }[] = [
  { value: "11+", label: "products shipped" },
  { value: "100K+", label: "users reached" },
  { value: "8+", label: "years in product" },
];

function ProofRow({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "10px 26px",
        marginTop: 34,
        ...style,
      }}
    >
      {STATS.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px 22px" }}>
          {i > 0 && <span aria-hidden style={{ color: T.border, fontSize: TYPE.lead }}>·</span>}
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: TYPE.display, fontWeight: 900, color: T.mauve, letterSpacing: 0.5 }}>{s.value}</span>
            <span style={{ fontSize: TYPE.small, fontWeight: 600, color: T.textMuted }}>{s.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── CTA: neon breathe + subtle magnetic pull toward the pointer ───────────────
function MagneticCTA({
  reduced,
  onClick,
  glow,
  rise,
}: {
  reduced: boolean;
  onClick: () => void;
  glow: string | undefined;
  rise: React.CSSProperties | undefined;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Magnetic pull written straight to the node's transform — no state, no
  // re-render per pointer move. On the stage, the wrapper owns placement and
  // scale, so the two transforms never fight.
  const onMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType === "touch" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const ox = Math.max(-10, Math.min(10, dx * 0.18));
    const oy = Math.max(-8, Math.min(8, dy * 0.3));
    ref.current.style.transform = `translate(${ox}px, ${oy}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0px, 0px)";
  };

  return (
    <button
      ref={ref}
      className="hero-cta"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      autoFocus
      style={{
        // The breathe rides an ::after overlay (index.css) whose opacity animates.
        ...(glow ? ({ "--cta-glow": glow } as React.CSSProperties) : null),
        marginTop: rise ? 42 : 0,
        padding: "18px 40px",
        fontSize: TYPE.body,
        fontWeight: 800,
        letterSpacing: 1,
        background: T.blue,
        color: T.text,
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "transform .18s cubic-bezier(.22,.61,.36,1)",
        ...rise,
      }}
    >
      ENTER THE UNIVERSE
    </button>
  );
}
