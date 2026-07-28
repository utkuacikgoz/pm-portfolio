import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProgress } from "../state/progress";
import { CONTACT } from "../content/contact";
import { sfx } from "../audio/sfx";

function EggLink({ children }: { children: ReactNode }) {
  return (
    <a
      href={CONTACT.calendar}
      target="_blank"
      rel="noopener"
      style={{ color: "#3FA46A", fontWeight: 800, textDecoration: "underline" }}
    >
      {children}
    </a>
  );
}

// One reward per egg id. Copy is dash-free and plain-Latin by house style.
const EGG_MESSAGES: Record<string, { tag: string; body: ReactNode }> = {
  surf: {
    tag: "SECRET FOUND",
    body: (
      <>
        You actually went looking. That&apos;s the trait I hire for. Utku&apos;s surfed in a dozen
        of those 53 countries. <EggLink>Now go book the call →</EggLink>
      </>
    ),
  },
  konami: {
    tag: "↑ ↑ ↓ ↓ ← → ← → B A",
    body: (
      <>
        You speak fluent nerd. Thirty years of muscle memory, still sharp. Exactly the kind of
        person I like building with. <EggLink>Let&apos;s build something →</EggLink>
      </>
    ),
  },
  hire: {
    tag: "MESSAGE RECEIVED",
    body: (
      <>
        You typed &quot;hire&quot;. Bold, direct, and a little cheeky. I like all three.{" "}
        <EggLink>Book a call →</EggLink>
      </>
    ),
  },
};

/**
 * Reward toast for finding an easter egg. Shows once per egg, only for eggs
 * discovered during THIS session (returning visitors who already found one
 * aren't re-toasted). Plays the reward sound on reveal (if sound is on).
 */
export default function EggToast() {
  const { eggs } = useProgress();
  const seen = useRef<Set<string>>(new Set(eggs)); // eggs known at mount
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    for (const id of eggs) {
      if (!seen.current.has(id) && EGG_MESSAGES[id]) {
        seen.current.add(id);
        setCurrent(id);
        sfx.play("egg");
        break;
      }
    }
  }, [eggs]);

  if (!current) return null;
  const msg = EGG_MESSAGES[current];

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
        border: "2px solid #3FA46A",
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
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "#3FA46A", marginBottom: 4 }}>
          {msg.tag}
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#e7e9ee", margin: 0 }}>{msg.body}</p>
      </div>
      <button
        onClick={() => setCurrent(null)}
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
