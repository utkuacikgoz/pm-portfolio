import { sfx, useSound } from "../audio/sfx";

/**
 * Bottom-left speaker toggle. Sound is muted by default (office-safe); this is
 * the always-visible way to turn on the ambient pad + interaction SFX. State
 * persists across visits.
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
        background: "rgba(7,8,12,0.8)",
        border: "1px solid #23283a",
        color: "#c4c8d2",
        fontSize: 18,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
