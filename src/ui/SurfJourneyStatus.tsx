import { CHECKPOINT_TOTAL, COIN_TOTAL } from "../world/surf-journey";
import { T } from "../theme";

export default function SurfJourneyStatus({ coins, visited }: { coins: number; visited: number }) {
  const progress = Math.round((coins / COIN_TOTAL) * 100);
  return (
    <div
      aria-label="Surf journey progress"
      style={{
        position: "fixed",
        top: 72,
        left: 24,
        zIndex: 45,
        width: 210,
        padding: "11px 13px",
        background: "rgba(7,8,12,0.85)",
        border: `1px solid ${T.sand}66`,
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.7 }}>
        <span style={{ color: T.sand }}>FOLLOW THE COIN TRAIL</span>
        <span style={{ color: "#c4c8d2" }}>{progress}%</span>
      </div>
      <div style={{ height: 4, margin: "8px 0", background: "#252a3a" }}>
        <div data-testid="surf-progress-bar" style={{ width: `${progress}%`, height: "100%", background: T.sand, transition: "width .25s ease" }} />
      </div>
      <div style={{ fontSize: 11.5, color: "#c4c8d2" }}>
        🧭 {visited} / {CHECKPOINT_TOTAL} product principles found
      </div>
    </div>
  );
}
