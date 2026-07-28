import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import { AVATARS, writeAvatar } from "./avatars";

// RPG-style "choose your character" gate shown before the world. Fun label only:
// the pick is cosmetic (a badge), it doesn't branch any copy or story. Data +
// persistence live in ./avatars so this file only exports a component.
export default function AvatarSelect({ onPick }: { onPick: (id: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const [focus, setFocus] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow-key navigation between characters (RPG feel); Enter/Space selects natively.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocus((f) => {
          const next = (f + (e.key === "ArrowRight" ? 1 : AVATARS.length - 1)) % AVATARS.length;
          btnRefs.current[next]?.focus();
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    btnRefs.current[0]?.focus();
  }, []);

  const choose = (id: string) => {
    writeAvatar(id);
    onPick(id);
  };

  const rise = (delay: number): React.CSSProperties =>
    reduced ? {} : { animation: "heroRise .55s cubic-bezier(.22,.61,.36,1) both", animationDelay: `${delay}s` };

  return (
    <div
      role="dialog"
      aria-label="Choose your character"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 72,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px 16px",
        overflowY: "auto",
        // Black-neon entrance, matching the hero.
        background:
          "radial-gradient(120% 80% at 50% 8%, rgba(255,0,128,0.10), transparent 46%), radial-gradient(120% 80% at 50% 100%, rgba(0,255,255,0.08), transparent 52%), radial-gradient(circle at 50% 40%, #0a0a14 0%, #050509 64%, #020204 100%)",
      }}
    >
      <p style={{ letterSpacing: 5, fontSize: 12, fontWeight: 800, color: "#7f8694", marginBottom: 6, ...rise(0) }}>
        SELECT YOUR CHARACTER
      </p>
      <h2
        style={{
          fontSize: "clamp(22px, 4vw, 38px)",
          fontWeight: 900,
          marginBottom: 26,
          textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          ...rise(0.06),
        }}
      >
        Who&apos;s judging me today?
      </h2>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", maxWidth: 860 }}>
        {AVATARS.map((a, i) => {
          const active = i === focus;
          return (
            <button
              key={a.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => choose(a.id)}
              onFocus={() => setFocus(i)}
              onPointerEnter={() => setFocus(i)}
              aria-label={`${a.label}, ${a.title}. ${a.pun}`}
              style={{
                width: 244,
                maxWidth: "calc(100vw - 40px)",
                padding: "20px 18px 18px",
                background: active ? "rgba(12,16,30,0.9)" : "rgba(8,12,24,0.6)",
                border: `2px solid ${active ? a.accent : a.accent + "44"}`,
                color: "#fff",
                cursor: "pointer",
                textAlign: "center",
                borderRadius: 14,
                transform: !reduced && active ? "translateY(-8px)" : "translateY(0)",
                boxShadow: active ? `0 16px 46px ${a.accent}33, inset 0 0 30px ${a.accent}14` : "none",
                transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease",
                ...rise(0.14 + i * 0.08),
              }}
            >
              {/* Portrait: crisp pixel-art, framed like an RPG roster slot. */}
              <div
                style={{
                  width: 84,
                  height: 84,
                  margin: "0 auto 12px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: `radial-gradient(circle at 50% 40%, ${a.accent}26, #05060a 72%)`,
                  border: `1.5px solid ${active ? a.accent : a.accent + "66"}`,
                  boxShadow: active ? `inset 0 0 22px ${a.accent}22` : "none",
                }}
                aria-hidden
              >
                <img
                  src={a.portrait}
                  alt=""
                  width={72}
                  height={72}
                  style={{ imageRendering: "pixelated", display: "block" }}
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.5, color: a.accent }}>
                {a.label}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: "#9aa0ac", marginBottom: 10 }}>
                {a.title.toUpperCase()}
              </div>
              <div style={{ fontSize: 12.5, color: "#c4c8d2", lineHeight: 1.45, minHeight: 34, marginBottom: 12 }}>
                {a.pun}
              </div>

              {/* Stat bars */}
              <div style={{ display: "grid", gap: 6, marginBottom: 12, textAlign: "left" }}>
                {a.stats.map((s, si) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 74, fontSize: 10.5, fontWeight: 700, color: "#8b919e", letterSpacing: 0.3 }}>
                      {s.label}
                    </span>
                    <span style={{ flex: 1, height: 6, background: "#1b2030", borderRadius: 999, overflow: "hidden" }}>
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: `${s.value * 10}%`,
                          background: a.accent,
                          borderRadius: 999,
                          transformOrigin: "left",
                          animation: reduced ? undefined : `statFill .5s ease ${0.3 + si * 0.08}s both`,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, color: a.accent }}>
                ★ {a.move}
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "#7f8694", marginTop: 22, ...rise(0.5) }}>
        Arrow keys to browse, Enter to lock it in. (It just picks your badge.)
      </p>
    </div>
  );
}
