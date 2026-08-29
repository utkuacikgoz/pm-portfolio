import { T, TYPE } from "../theme";

// One panel for the whole run. The coin count used to live in a separate chip
// stacked directly above this, which put the same number on screen twice.
// Totals arrive as props rather than as an import. Reading them from
// `world/surf-journey` pulled that module, and through it the whole island
// geometry graph, into the entry chunk for every visitor: a few hundred lines
// of procedural builders and forty two coin positions, shipped to a phone that
// renders a flat list of case studies.
export default function SurfJourneyStatus({
  coins,
  coinTotal,
  visited,
  checkpointTotal,
}: {
  coins: number;
  coinTotal: number;
  visited: number;
  checkpointTotal: number;
}) {
  const progress = coinTotal > 0 ? Math.round((coins / coinTotal) * 100) : 0;
  return (
    <div
      aria-label="Surf journey progress"
      style={{
        position: "fixed",
        top: 20,
        left: 24,
        zIndex: 45,
        width: 210,
        padding: "11px 13px",
        background: T.scrim,
        border: `1px solid ${T.sand}66`,
        backdropFilter: "blur(6px)",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: T.sand, fontSize: TYPE.body, fontWeight: 800, letterSpacing: 0.3 }}>
          🪙 {coins} / {coinTotal}
        </span>
        <span style={{ color: T.textSoft, fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 0.7 }}>{progress}%</span>
      </div>
      <div style={{ height: 4, margin: "8px 0", background: T.border }}>
        <div data-testid="surf-progress-bar" style={{ width: `${progress}%`, height: "100%", background: T.sand, transition: "width .25s ease" }} />
      </div>
      <div style={{ fontSize: TYPE.micro, color: T.textSoft }}>
        🧭 {visited} / {checkpointTotal} product principles found
      </div>
    </div>
  );
}
