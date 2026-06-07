import type {
  Metric,
  Decision,
  Initiative,
  Stakeholder,
} from "../../content/types";

// Lightweight SVG/DOM replacements for the old per-chart WebGL contexts.
// Crisp, accessible, zero extra GL contexts. Each is keyboard/SR friendly.

const card = (accent: string): React.CSSProperties => ({
  border: `2px solid ${accent}33`,
  background: "#0a0c12",
  padding: "20px 22px",
  marginBottom: 20,
});

const heading = (accent: string): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: accent,
  marginBottom: 16,
});

export function MetricsBars({ metrics }: { metrics: Metric[] }) {
  return (
    <div style={card("#888")}>
      <div style={heading("#aaa")}>Before → After</div>
      <div style={{ display: "grid", gap: 16 }}>
        {metrics.map((m, i) => {
          const max = Math.max(m.before, m.after) || 1;
          const improved =
            (m.after - m.before) / (m.before || 1);
          const pct = Math.round(Math.abs(improved) * 100);
          return (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6,
                  color: "#cfd3dc",
                }}
              >
                <span style={{ fontWeight: 600 }}>{m.label}</span>
                <span style={{ color: m.color, fontWeight: 700 }}>
                  {m.before}
                  {m.unit} → {m.after}
                  {m.unit}{" "}
                  <span style={{ color: "#7f8694" }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <Bar value={m.before} max={max} color="#3a3f4d" />
                <Bar value={m.after} max={max} color={m.color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ height: 8, background: "#15171f" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.max(2, (value / max) * 100)}%`,
          background: color,
          transition: "width .4s ease",
        }}
      />
    </div>
  );
}

// Generic 2-axis scatter used by both Decision and Effort/Impact charts.
function Scatter({
  accent,
  title,
  xLabel,
  yLabel,
  points,
}: {
  accent: string;
  title: string;
  xLabel: string;
  yLabel: string;
  points: { x: number; y: number; r: number; color: string; label: string; highlight?: boolean }[];
}) {
  const W = 280;
  const H = 200;
  const pad = 28;
  const px = (x: number) => pad + (x / 100) * (W - pad * 2);
  const py = (y: number) => H - pad - (y / 100) * (H - pad * 2);
  return (
    <div style={card(accent)}>
      <div style={heading(accent)}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: ${xLabel} versus ${yLabel}`}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#2a2e3a" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#2a2e3a" />
        <text x={W - pad} y={H - 8} fill="#6b7280" fontSize="9" textAnchor="end">
          {xLabel} →
        </text>
        <text x={10} y={pad} fill="#6b7280" fontSize="9">
          {yLabel} ↑
        </text>
        {points.map((p, i) => (
          <g key={i}>
            {p.highlight && (
              <circle cx={px(p.x)} cy={py(p.y)} r={p.r + 5} fill="none" stroke={p.color} strokeWidth="1.5" opacity="0.6" />
            )}
            <circle cx={px(p.x)} cy={py(p.y)} r={p.r} fill={p.color} opacity={p.highlight ? 1 : 0.7} />
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10 }}>
        {points.map((p, i) => (
          <span key={i} style={{ fontSize: 11, color: p.highlight ? "#fff" : "#9aa0ac", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, background: p.color, display: "inline-block", borderRadius: "50%" }} />
            {p.label}
            {p.highlight ? " ★" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DecisionMatrix({ decisions, accent }: { decisions: Decision[]; accent: string }) {
  return (
    <Scatter
      accent={accent}
      title="Decision Matrix"
      xLabel="Speed"
      yLabel="Safety"
      points={decisions.map((d) => ({
        x: d.speed,
        y: 100 - d.risk, // higher = safer
        r: d.isChosen ? 8 : 6,
        color: d.color,
        label: d.label,
        highlight: d.isChosen,
      }))}
    />
  );
}

export function EffortImpact({ initiatives, accent }: { initiatives: Initiative[]; accent: string }) {
  return (
    <Scatter
      accent={accent}
      title="Effort vs Impact"
      xLabel="Effort"
      yLabel="Impact"
      points={initiatives.map((it) => ({
        x: it.effort,
        y: it.impact,
        r: 4 + (it.timeToValue / 100) * 8,
        color: it.color,
        label: it.label,
      }))}
    />
  );
}

export function Stakeholders({ stakeholders, accent }: { stakeholders: Stakeholder[]; accent: string }) {
  return (
    <div style={card(accent)}>
      <div style={heading(accent)}>Stakeholders aligned</div>
      <div style={{ display: "grid", gap: 8 }}>
        {stakeholders.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, background: s.color, display: "inline-block" }} />
            <span style={{ fontWeight: 700, color: "#e7e9ee" }}>{s.name}</span>
            <span style={{ color: "#7f8694" }}>· {s.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
