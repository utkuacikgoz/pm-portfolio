import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";

/**
 * Opening identity beat — shown first, over the camera's wide establishing shot.
 * The scrim is deliberately light so the low-poly world is alive behind the copy
 * from the first frame; "Begin" flies the camera down into the world. The resume
 * escape hatch is always one click away.
 */
export default function HeroIntro({ onBegin }: { onBegin: () => void }) {
  const reduced = usePrefersReducedMotion();
  // Stagger helper: each element rises in, unless reduced-motion (then static).
  const rise = (delay: number): React.CSSProperties =>
    reduced ? {} : { animation: `heroRise .7s cubic-bezier(.22,.61,.36,1) both`, animationDelay: `${delay}s` };

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
        // Entrance stays black-neon (Utku's call): opaque black base with a
        // faint magenta/cyan glow. The tropical-dusk world is revealed only
        // after Begin dives the camera in.
        background:
          "radial-gradient(120% 80% at 50% 8%, rgba(255,0,128,0.10), transparent 46%), radial-gradient(120% 80% at 50% 100%, rgba(0,255,255,0.08), transparent 52%), radial-gradient(circle at 50% 42%, #0a0a14 0%, #050509 62%, #020204 100%)",
        textShadow: "0 2px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
      }}
    >
      <p style={{ letterSpacing: 5, fontSize: 12, fontWeight: 700, color: "#9aa0ac", marginBottom: 16, ...rise(0) }}>
        UTKU ACIKGOZ
      </p>
      <h1 style={{ fontSize: "clamp(40px, 8vw, 82px)", fontWeight: 900, lineHeight: 1.05, maxWidth: 900 }}>
        <span style={{ display: "block", ...rise(0.08) }}>Senior Technical</span>
        <span style={{ display: "block", ...rise(0.16) }}>Product Manager</span>
      </h1>
      <p
        style={{
          fontSize: "clamp(15px, 2.5vw, 19px)",
          color: "#dfe2e9",
          marginTop: 20,
          maxWidth: 620,
          lineHeight: 1.6,
          ...rise(0.26),
        }}
      >
        8+ years across fintech, blockchain, HRtech &amp; SaaS. Explore the work as a
        world. Each island is a product I built.
      </p>

      <ProofRow reduced={reduced} style={rise(0.36)} />

      <MagneticCTA reduced={reduced} onClick={onBegin} delay={0.46} />

      <Link
        to="/resume"
        style={{
          marginTop: 18,
          fontSize: 13,
          fontWeight: 700,
          color: "#9aa0ac",
          textDecoration: "underline",
          ...rise(0.54),
        }}
      >
        or skip straight to the resume
      </Link>
    </div>
  );
}

// ── Proof metrics: recruiter-skimmable numbers that count up on entry ─────────
const STATS: { n: number; suffix: string; label: string }[] = [
  { n: 11, suffix: "", label: "products shipped" },
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
        gap: "8px 22px",
        marginTop: 26,
        ...style,
      }}
    >
      {STATS.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px 22px" }}>
          {i > 0 && <span aria-hidden style={{ color: "#4a4f5e", fontSize: 18 }}>·</span>}
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#00FFFF", letterSpacing: 0.5 }}>
              <CountUp target={s.n} suffix={s.suffix} reduced={reduced} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#9aa0ac" }}>{s.label}</span>
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
    : `heroRise .7s cubic-bezier(.22,.61,.36,1) ${delay}s both, ctaGlow 2.8s ease-in-out ${delay + 0.9}s infinite`;

  return (
    <button
      ref={ref}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      autoFocus
      style={{
        marginTop: 34,
        padding: "16px 34px",
        fontSize: 15,
        fontWeight: 800,
        letterSpacing: 1,
        background: "#FF0080",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        transition: "transform .18s cubic-bezier(.22,.61,.36,1)",
        animation,
      }}
    >
      BEGIN THE JOURNEY ▸
    </button>
  );
}
