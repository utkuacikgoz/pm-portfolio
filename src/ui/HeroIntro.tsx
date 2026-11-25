import { Fragment, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import Rocket from "./Rocket";
import { T, TYPE } from "../theme";
import { AVAILABILITY, BOOK_CALL, LANDING_LINE } from "../content/positioning";
import { CONTACT } from "../content/contact";
import { EVENTS, track } from "../analytics/events";

// The headline, one array per rendered line. Split into words so each one can be
// blown out of the nozzle on its own beat instead of the line arriving as a slab.
const HEADLINE = ["Senior Technical", "Product Manager"].map((line) => line.split(" "));
const HEADLINE_START = 0.48;
const WORD_STAGGER = 0.06;
// The looping heat pulse runs on its own clock, shared by every word, so the
// wave stays coherent instead of inheriting the reading-order entry stagger.
const HEAT_START = 1.3;
const HEAT_STAGGER = 0.15;

/** Launch order: the rocket arrives, the exhaust paints, the words land in it. */
const wordDelay = (lineIndex: number, wordIndex: number) => {
  const before = HEADLINE.slice(0, lineIndex).reduce((n, words) => n + words.length, 0);
  return HEADLINE_START + (before + wordIndex) * WORD_STAGGER;
};

/**
 * Heat delay by COLUMN, not reading order: the exhaust blows right to left, so
 * the word nearest the nozzle catches the pulse first and it rolls back up the
 * line. Both headline lines are the same distance from the engine, so they
 * catch it together.
 */
const heatDelay = (wordIndex: number, wordCount: number) =>
  HEAT_START + (wordCount - 1 - wordIndex) * HEAT_STAGGER;

/**
 * Opening identity beat. Pure DOM: no Canvas is mounted behind it, by design
 * (see CLAUDE.md, entrance flow), so three.js only downloads once someone
 * commits to entering. "Begin" mounts the world at its wide establishing shot
 * and flies the camera down into it. The resume escape hatch is always one
 * click away.
 *
 * The entrance is staged as a launch: a flat-shaded rocket (`Rocket`, SVG) flies
 * in from off-screen, settles beside the headline and holds station under power,
 * and the name and title are deposited in its exhaust. They enter smeared toward
 * the engine and sharpen as the plume settles, so the identity reads as
 * something the rocket left behind rather than text that faded in next to it.
 * All CSS and SVG: see the "Hero launch" block in `index.css`.
 */
export default function HeroIntro({ onBegin }: { onBegin: () => void }) {
  const reduced = usePrefersReducedMotion();
  // Stagger helper: each element rises in, unless reduced-motion (then static).
  const rise = (delay: number): React.CSSProperties =>
    reduced ? {} : { animation: `heroRise .7s cubic-bezier(.22,.61,.36,1) both`, animationDelay: `${delay}s` };
  // The identity lines get the exhaust treatment instead: a horizontal smear out
  // of the nozzle that decelerates into place, and then a heat pulse that keeps
  // washing over them for as long as the engine is lit. Two animations, two
  // clocks: `exhaustIn` fills forward and `wordHeat` takes the properties over
  // from the same resting values, so the handover is invisible.
  const exhaust = (delay: number, heat: number): React.CSSProperties =>
    reduced
      ? {}
      : {
          animation:
            `exhaustIn .8s cubic-bezier(.16,.84,.3,1) ${delay}s both, ` +
            `wordShift 2.2s ease-in-out ${heat}s infinite`,
          transformOrigin: "right center",
          // Read by `.hero-word::after`, which an inline style cannot reach.
          "--glow-delay": `${heat}s`,
        } as React.CSSProperties;
  // The hot half of the pulse renders as `.hero-word::after` (index.css), which
  // reads the word off `data-word` and fades its own opacity. A pseudo-element
  // rather than a twin span so the glow's text never lands in the heading's
  // `textContent`. The per-word delay has to travel as a custom property because
  // an inline style cannot address a pseudo-element.
  const glow = (text: string) =>
    reduced ? { className: "hero-word is-static" } : { className: "hero-word", "data-word": text };

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
        // The rocket starts off-screen left; clip it rather than letting the
        // flight path widen the page.
        overflow: "hidden",
        // Entrance stays black (Utku's call): opaque black base with a faint
        // coral/periwinkle glow (logo palette). The dusk world is revealed only
        // after entering dives the camera in.
        background: `radial-gradient(120% 80% at 50% 8%, ${T.entranceGlow.coral}, transparent 46%), radial-gradient(120% 80% at 50% 100%, ${T.entranceGlow.blue}, transparent 52%), radial-gradient(circle at 50% 42%, ${T.inkRaised} 0%, ${T.ink} 62%, #0C0A09 100%)`,
        textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
      }}
    >
      <img src="/utku-logo.svg" alt="" width={56} height={56} style={{ marginBottom: 26, ...rise(0) }} />

      <div className="hero-identity">
        <Exhaust reduced={reduced} />
        <div className="hero-identity-copy">
          <p
            {...glow("UTKU ACIKGOZ")}
            style={{
              letterSpacing: 5,
              fontSize: TYPE.small,
              fontWeight: 700,
              color: T.textMuted,
              marginBottom: 16,
              ...exhaust(0.4, HEAT_START + HEAT_STAGGER * 2),
            }}
          >
            UTKU ACIKGOZ
          </p>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 82px)", fontWeight: 900, lineHeight: 1.05 }}>
            {HEADLINE.map((words, lineIndex) => (
              <Fragment key={words.join(" ")}>
                {/* The two lines are block spans sitting flush against each
                    other, so without this the heading's text content reads
                    "Senior TechnicalProduct Manager". Invisible in a block
                    layout, correct to a crawler. */}
                {lineIndex > 0 && " "}
                <span style={{ display: "block" }}>
                {words.map((word, wordIndex) => (
                  <Fragment key={word}>
                    {/* A real space, so the heading's text content still reads
                        "Senior Technical Product Manager" to a crawler. */}
                    {wordIndex > 0 && " "}
                    <span
                      {...glow(word)}
                      style={{
                        display: "inline-block",
                        ...exhaust(wordDelay(lineIndex, wordIndex), heatDelay(wordIndex, words.length)),
                      }}
                    >
                      {word}
                    </span>
                  </Fragment>
                  ))}
                </span>
              </Fragment>
            ))}
          </h1>
        </div>
        <div className="hero-rocket-anchor" aria-hidden>
          {/* Two nested wrappers: the flight and the station-keeping hover both
              animate `transform`, and one element can only be driven by one. */}
          <div style={reduced ? undefined : { animation: "rocketEnter 1s cubic-bezier(.16,.84,.3,1) .05s both" }}>
            <div style={reduced ? undefined : { animation: "rocketHover 2.6s ease-in-out 1.05s infinite" }}>
              <div style={reduced ? undefined : { animation: "rocketShudder .11s steps(2, end) 1.05s infinite alternate" }}>
                <Rocket animated={!reduced} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* One supporting line, not three. With the sub-line and the second resume
          link gone, everything below the headline gets more air and the CTA is
          the only thing asking to be clicked. */}
      <p
        style={{
          fontSize: "clamp(17px, 2.8vw, 22px)",
          color: T.textSoft,
          marginTop: 26,
          maxWidth: 660,
          lineHeight: 1.65,
          ...rise(0.74),
        }}
      >
        {LANDING_LINE}
      </p>

      <ProofRow reduced={reduced} style={rise(0.82)} />

      <MagneticCTA reduced={reduced} onClick={onBegin} delay={0.9} />

      {/* Availability on the landing itself, one quiet line under the main
          action. A recruiter used to have to finish a case study to learn
          whether Utku was looking. Deliberately a text link, not a second
          button, so ENTER stays the hero's only call to action. */}
      <p style={{ marginTop: 22, fontSize: TYPE.small, color: T.textSoft, ...rise(1.05) }}>
        {AVAILABILITY}{" "}
        <a
          href={CONTACT.calendar}
          target="_blank"
          rel="noopener"
          onClick={() => track(EVENTS.ctaClicked, { cta: "book_call", location: "hero" })}
          style={{ display: "inline-flex", alignItems: "center", minHeight: 44, color: T.text, fontWeight: 800, textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          {BOOK_CALL} →
        </a>
      </p>
    </div>
  );
}

// ── Exhaust: the cone, its hot core, and the embers it sheds ──────────────────
// Anchored off `--rocket-w` (index.css) so the plume always starts at the
// nozzle, whatever size the rocket is rendering at.
type Spark = {
  y: number;
  delay: number;
  duration: number;
  size: number;
  width?: number;
  distance?: number;
  color: string;
};

// Fifteen on unrelated cycles and short lifetimes: dense enough that the stream
// never visibly restarts, still only fifteen composited transforms. `width`
// makes a spark a speed line rather than an ember.
const SPARKS: Spark[] = [
  { y: -46, delay: 0.9, duration: 1.05, size: 6, color: T.amber },
  { y: -18, delay: 1.02, duration: 0.9, size: 4, width: 44, color: T.gold },
  { y: 8, delay: 0.96, duration: 1.2, size: 5, color: T.coral },
  { y: 34, delay: 1.14, duration: 0.85, size: 3, width: 56, color: T.amber },
  { y: 58, delay: 1.08, duration: 1.35, size: 5, color: T.gold },
  { y: -70, delay: 1.2, duration: 1.15, size: 4, distance: -660, color: T.coral },
  { y: -6, delay: 1.26, duration: 0.72, size: 3, width: 34, color: T.text },
  { y: 76, delay: 1.32, duration: 1.45, size: 4, color: T.amber },
  { y: -92, delay: 1.44, duration: 1.25, size: 3, distance: -700, color: T.gold },
  { y: 22, delay: 1.5, duration: 0.8, size: 3, width: 38, color: T.text },
  { y: -34, delay: 1.62, duration: 1.1, size: 5, color: T.amber },
  { y: 96, delay: 1.68, duration: 1.55, size: 3, distance: -420, color: T.coral },
  { y: -110, delay: 1.8, duration: 1.3, size: 4, color: T.gold },
  { y: 48, delay: 1.86, duration: 0.95, size: 4, width: 50, color: T.amber },
  { y: -58, delay: 1.98, duration: 1.4, size: 3, distance: -740, color: T.text },
];

function Exhaust({ reduced }: { reduced: boolean }) {
  // Paint owns transform and fills forward; the pulse takes over opacity once
  // the plume is fully drawn. Two properties, so both animations can coexist.
  const plume = reduced
    ? undefined
    : { animation: "plumePaint .9s cubic-bezier(.16,.84,.3,1) .28s both, plumePulse 2.1s ease-in-out 1.1s infinite" };

  // Stripes scrolling back down the cone: the flow that never stops. The paint-on
  // stays on the cone (it shares the plume's clock); the endless scroll lives on
  // a child so it can be a composited transform instead of a per-frame repaint.
  const flow = reduced
    ? undefined
    : { animation: "plumePaint .9s cubic-bezier(.16,.84,.3,1) .28s both" };
  // The stripes live on this child so the loop can be a composited transform.
  const stripes = reduced
    ? undefined
    : { animation: "plumeFlow var(--flow-secs) linear .8s infinite" };

  return (
    <div className="hero-exhaust" aria-hidden>
      <div className="hero-plume" style={plume} />
      <div className="hero-plume-flow" style={flow}>
        <i style={stripes} />
      </div>
      {/* Second, finer sheet running faster over the first: the two shear
          against each other, which is what stops the flow reading as one rigid
          scrolling texture. */}
      <div className="hero-plume-flow is-fine" style={flow}>
        <i style={stripes} />
      </div>
      <div className="hero-plume-core" style={plume} />
      {!reduced &&
        SPARKS.map((spark) => (
          <span
            key={`${spark.y}-${spark.delay}`}
            className="hero-spark"
            style={
              {
                "--spark-y": `${spark.y}px`,
                "--spark-size": `${spark.size}px`,
                "--spark-w": spark.width ? `${spark.width}px` : undefined,
                "--spark-dist": spark.distance ? `${spark.distance}px` : undefined,
                "--spark-color": spark.color,
                animation: `sparkDrift ${spark.duration}s ease-out ${spark.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}

// ── Proof metrics: recruiter-skimmable numbers that count up on entry ─────────
const STATS: { n: number; suffix: string; label: string }[] = [
  { n: 11, suffix: "+", label: "products shipped" },
  { n: 100, suffix: "K+", label: "users reached" },
  { n: 8, suffix: "+", label: "years in product" },
];

function ProofRow({ reduced, style }: { reduced: boolean; style: React.CSSProperties }) {
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
            <span style={{ fontSize: TYPE.display, fontWeight: 900, color: T.mauve, letterSpacing: 0.5 }}>
              <CountUp target={s.n} suffix={s.suffix} reduced={reduced} />
            </span>
            <span style={{ fontSize: TYPE.small, fontWeight: 600, color: T.textMuted }}>{s.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// Counts up by writing textContent directly (no per-frame React re-render, so
// the world Canvas behind stays smooth during the intro).
function CountUp({ target, suffix, reduced }: { target: number; suffix: string; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.textContent = `${target}${suffix}`;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    el.textContent = `0${suffix}`;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, suffix, reduced]);
  return <span ref={ref}>{`${reduced ? target : 0}${suffix}`}</span>;
}

// ── CTA: neon breathe + subtle magnetic pull toward the pointer ───────────────
function MagneticCTA({
  reduced,
  onClick,
  delay,
}: {
  reduced: boolean;
  onClick: () => void;
  delay: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  // Magnetic pull written straight to the node's transform — no state, no
  // re-render per pointer move.
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

  // Rise in, then breathe: two comma-separated animations, glow starting after
  // the entrance settles. Disabled entirely under reduced-motion.
  const animation = reduced
    ? undefined
    : `heroRise .7s cubic-bezier(.22,.61,.36,1) ${delay}s both`;
  // The breathe rides an ::after overlay (index.css) whose opacity animates.
  const glow = reduced ? undefined : `ctaGlow 2.8s ease-in-out ${delay + 0.9}s infinite`;

  return (
    <button
      ref={ref}
      className="hero-cta"
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      autoFocus
      style={{
        ...(glow ? ({ "--cta-glow": glow } as React.CSSProperties) : null),
        marginTop: 42,
        padding: "18px 40px",
        fontSize: TYPE.body,
        fontWeight: 800,
        letterSpacing: 1,
        background: T.blue,
        color: T.text,
        border: "none",
        cursor: "pointer",
        transition: "transform .18s cubic-bezier(.22,.61,.36,1)",
        animation,
      }}
    >
      ENTER THE UNIVERSE
    </button>
  );
}
