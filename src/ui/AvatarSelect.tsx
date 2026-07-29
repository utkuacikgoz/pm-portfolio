import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./hooks/useReducedMotion";
import { AVATARS, writeAvatar } from "./avatars";

// "Choose your character" gate, styled as an arcade cabinet select: pixel-stepped
// frames, CRT scanlines, segmented stat blocks, a blinking PRESS ENTER. Fun label
// only — the pick is cosmetic. Data lives in ./avatars (this file only exports a
// component, for react-refresh).

// Octagonal 8-bit notch, used for the slot frame + its inner fill.
const NOTCH =
  "polygon(0 7px, 7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px))";
const PIXEL_SHADOW = "3px 3px 0 rgba(0,0,0,0.65)";

export default function AvatarSelect({ onPick }: { onPick: (id: string) => void }) {
  const reduced = usePrefersReducedMotion();
  const [focus, setFocus] = useState(0);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = (focus + (e.key === "ArrowRight" ? 1 : AVATARS.length - 1)) % AVATARS.length;
      slotRefs.current[next]?.focus(); // onFocus updates selection
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  useEffect(() => {
    slotRefs.current[0]?.focus();
  }, []);

  const choose = (id: string) => {
    writeAvatar(id);
    onPick(id);
  };

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
        gap: 26,
        textAlign: "center",
        padding: "24px 16px",
        overflowY: "auto",
        background:
          "radial-gradient(120% 80% at 50% 6%, rgba(172,74,45,0.10), transparent 46%), radial-gradient(120% 80% at 50% 100%, rgba(79,87,176,0.08), transparent 52%), radial-gradient(circle at 50% 42%, #FBF6EC 0%, #F4EFE6 64%, #EBE3D6 100%)",
      }}
    >
      {/* CRT scanlines */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 73,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
          opacity: 0.12,
          animation: reduced ? undefined : "crtFlicker 3s ease-in-out infinite",
        }}
      />

      <div>
        <p style={{ letterSpacing: 6, fontSize: 12, fontWeight: 800, color: "#7f8694", marginBottom: 6 }}>
          SELECT YOUR CHARACTER
        </p>
        <h2
          style={{
            fontSize: "clamp(24px, 4.4vw, 42px)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 1,
            textShadow: PIXEL_SHADOW,
          }}
        >
          Who&apos;s judging me today?
        </h2>
      </div>

      <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", maxWidth: 900 }}>
        {AVATARS.map((a, i) => {
          const active = i === focus;
          const border = active ? a.accent : "#252a38";
          return (
            <button
              key={a.id}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
              onClick={() => choose(a.id)}
              onFocus={() => setFocus(i)}
              onPointerEnter={() => setFocus(i)}
              aria-label={`${a.label}, ${a.title}. ${a.pun}`}
              style={{
                width: 268,
                maxWidth: "calc(100vw - 40px)",
                padding: 3, // shows as the pixel frame
                background: border,
                clipPath: NOTCH,
                border: "none",
                cursor: "pointer",
                transform: !reduced && active ? "translateY(-6px)" : "none",
                filter: active ? `drop-shadow(0 12px 26px ${a.accent}44)` : "none",
                transition: "transform .15s ease, filter .15s ease, background .15s ease",
              }}
            >
              <div
                style={{
                  clipPath: NOTCH,
                  background: active
                    ? `radial-gradient(120% 90% at 50% 0%, ${a.accent}14, #FCF9F3 60%)`
                    : "#F4EFE6",
                  padding: "18px 16px 16px",
                  textAlign: "center",
                }}
              >
                {/* Portrait */}
                <div
                  style={{
                    width: 104,
                    height: 104,
                    margin: "0 auto 12px",
                    display: "grid",
                    placeItems: "center",
                    background: "#F4EFE6",
                    border: `2px solid ${border}`,
                    boxShadow: active ? `inset 0 0 20px ${a.accent}22` : "none",
                  }}
                >
                  <img
                    src={a.portrait}
                    alt=""
                    width={88}
                    height={88}
                    style={{ imageRendering: "pixelated", display: "block", opacity: active ? 1 : 0.82 }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    color: active ? a.accent : "#5C5766",
                    textShadow: active ? PIXEL_SHADOW : "none",
                  }}
                >
                  {a.label}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.5, color: "#8b919e", margin: "3px 0 9px" }}>
                  {a.title.toUpperCase()}
                </div>
                <div style={{ fontSize: 12.5, color: "#5C5766", lineHeight: 1.45, minHeight: 34, marginBottom: 12 }}>
                  {a.pun}
                </div>

                {/* Segmented 8-bit stat blocks */}
                <div style={{ display: "grid", gap: 6, textAlign: "left" }}>
                  {a.stats.map((s, si) => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 74, fontSize: 10, fontWeight: 700, color: "#8b919e", letterSpacing: 0.2 }}>
                        {s.label}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          display: "flex",
                          gap: 2,
                          transformOrigin: "left",
                          animation: reduced ? undefined : `statFill .45s steps(10) ${0.1 + si * 0.06}s both`,
                        }}
                      >
                        {Array.from({ length: 10 }).map((_, b) => (
                          <span
                            key={b}
                            style={{ flex: 1, height: 8, background: b < s.value ? a.accent : "#DED5C7" }}
                          />
                        ))}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Selection cue */}
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 10.5,
                    fontWeight: 900,
                    letterSpacing: 1.5,
                    color: a.accent,
                    visibility: active ? "visible" : "hidden",
                    animation: reduced ? undefined : "blink 1s steps(1) infinite",
                  }}
                >
                  PRESS ENTER
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#7f8694" }}>◄ ► SELECT&nbsp;&nbsp;&nbsp;ENTER START</p>
    </div>
  );
}
