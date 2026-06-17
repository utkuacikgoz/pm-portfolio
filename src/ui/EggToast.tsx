import { useEffect, useRef, useState } from "react";
import { useProgress } from "../state/progress";
import { CONTACT } from "../content/contact";

/**
 * Reward for finding the hidden easter egg. Shows once, only when the egg flips
 * false→true during this session (returning visitors who already found it aren't
 * re-toasted). Dismissible, no sound — a small personal beat that nudges the CTA.
 */
export default function EggToast() {
  const { egg } = useProgress();
  const alreadyFound = useRef(egg); // egg state at mount; true ⇒ don't re-toast
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (egg && !alreadyFound.current) setShow(true);
  }, [egg]);

  if (!show) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 80,
        width: "min(440px, calc(100vw - 24px))",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: "rgba(7,8,12,0.96)",
        border: "2px solid #00E5A0",
        borderRadius: 12,
        backdropFilter: "blur(8px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        animation: "panelIn .35s ease",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1.2 }}>
        🥚
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#00E5A0", marginBottom: 4 }}>
          SECRET FOUND
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#e7e9ee", margin: 0 }}>
          You actually went looking — that's the trait I hire for. Utku's surfed in a dozen of those 53
          countries.{" "}
          <a
            href={CONTACT.calendar}
            target="_blank"
            rel="noopener"
            style={{ color: "#00E5A0", fontWeight: 800, textDecoration: "underline" }}
          >
            Now go book the call →
          </a>
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          color: "#7f8694",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          lineHeight: 1,
          padding: 2,
        }}
      >
        ✕
      </button>
    </div>
  );
}
