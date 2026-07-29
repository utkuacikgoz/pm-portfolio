import { sfx, useSound } from "../audio/sfx";

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
        background: "rgba(252,249,243,0.92)",
        border: "1px solid #DED5C7",
        color: "#5C5766",
        fontSize: 18,
        cursor: "pointer",
        backdropFilter: "blur(6px)",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
