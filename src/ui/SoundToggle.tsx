import { sfx, useSound } from "../audio/sfx";
import { T, TYPE } from "../theme";

/**
 * Bottom-left speaker toggle. Sound (waterfall bed + interaction SFX) is ON by
 * default; this is the always-visible way to mute it. State persists across
 * visits.
 */
export default function SoundToggle() {
  const { muted, toggle } = useSound();
  return (
    <button
      onClick={() => {
        toggle();
        sfx.play("toggle"); // audible only when we just unmuted
      }}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      aria-pressed={!muted}
      title={muted ? "Sound off" : "Sound on"}
      style={{
        position: "fixed",
        left: 20,
        bottom: "calc(20px + env(safe-area-inset-bottom))",
        zIndex: 50,
        width: 42,
        height: 42,
        display: "grid",
        placeItems: "center",
        background: "rgba(29,24,22,0.8)",
        border: `1px solid ${T.border}`,
        color: T.textSoft,
        fontSize: TYPE.lead,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
