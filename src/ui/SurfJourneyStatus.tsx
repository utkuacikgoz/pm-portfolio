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
  projectsFound,
  projectTotal,
  onToggleHelp,
  onToggleProjects,
}: {
  coins: number;
  coinTotal: number;
  projectsFound: number;
  projectTotal: number;
  onToggleHelp: () => void;
  onToggleProjects: () => void;
}) {
  const projectProgress = projectTotal > 0 ? Math.round((projectsFound / projectTotal) * 100) : 0;
  return (
    <div
      aria-label="Surf journey progress"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 20,
        left: 24,
        zIndex: 45,
        width: 220,
        padding: "11px 13px",
        background: T.scrim,
        border: `1px solid ${T.sand}66`,
        backdropFilter: "blur(6px)",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ color: T.seafoam, fontSize: TYPE.body, fontWeight: 800, letterSpacing: 0.3 }}>
          PROJECTS {projectsFound} / {projectTotal}
        </span>
        <span style={{ color: T.textSoft, fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 0.7 }}>{projectProgress}%</span>
      </div>
      <div style={{ height: 4, margin: "8px 0", background: T.border }}>
        <div data-testid="surf-progress-bar" style={{ width: `${projectProgress}%`, height: "100%", background: T.seafoam, transition: "width .25s ease" }} />
      </div>
      <div style={{ color: T.sand, fontSize: TYPE.small, fontWeight: 700, marginBottom: 10 }}>
        🪙 {coins} / {coinTotal}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={onToggleHelp}
          style={{ minHeight: 40, border: `1px solid ${T.border}`, background: T.inkRaised, color: T.textSoft, fontSize: TYPE.micro, fontWeight: 800, cursor: "pointer" }}
        >
          CONTROLS
        </button>
        <button
          onClick={onToggleProjects}
          disabled={projectsFound === 0}
          style={{
            minHeight: 40,
            border: `1px solid ${projectsFound > 0 ? T.seafoam : T.border}`,
            background: T.inkRaised,
            color: projectsFound > 0 ? T.seafoam : T.textMuted,
            fontSize: TYPE.micro,
            fontWeight: 800,
            cursor: projectsFound > 0 ? "pointer" : "default",
          }}
        >
          FOUND {projectsFound}
        </button>
      </div>
    </div>
  );
}
