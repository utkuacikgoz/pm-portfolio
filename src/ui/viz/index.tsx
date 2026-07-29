import type {
  Metric,
  Decision,
  Initiative,
  Stakeholder,
} from "../../content/types";

// Readable DOM/SVG presentation of the PM data. Replaces the old scatter charts
// (which read as random dots) with labeled, scannable comparison cards.

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: "#7f8694",
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function MiniBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 96 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9aa0ac", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: "#cfd3dc", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#E6DED1", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export function Metrics({ metrics }: { metrics: Metric[] }) {
  return (
    <Section label="Outcomes">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {metrics.map((m, i) => {
          // A "from 0" baseline has no meaningful % change — showing one prints
          // nonsense like ↑6000%. Only render the delta when the baseline is real.
          const hasBaseline = m.before !== 0;
          const pct = hasBaseline ? Math.round((Math.abs(m.after - m.before) / m.before) * 100) : 0;
          const down = m.after < m.before;
          return (
            <div key={i} style={{ background: "#FCF9F3", border: "1px solid #DED5C7", borderRadius: 8, padding: "16px 18px" }}>
              <div style={{ fontSize: 12, color: "#9aa0ac", marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: m.color, lineHeight: 1 }}>
                {m.after}
                <span style={{ fontSize: 15, fontWeight: 700 }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 12, color: "#8b93a3", marginTop: 8 }}>
                {hasBaseline ? (
                  <>
                    from {m.before}
                    {m.unit}{" "}
                    <span style={{ color: m.color, fontWeight: 800 }}>
                      {down ? "↓" : "↑"}
                      {pct}%
                    </span>
                  </>
                ) : (
                  <span style={{ color: m.color, fontWeight: 800 }}>new</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function Decisions({ decisions, accent }: { decisions: Decision[]; accent: string }) {
  return (
    <Section label="The decision">
      <div style={{ display: "grid", gap: 10 }}>
        {decisions.map((d, i) => (
          <div
            key={i}
            style={{
              background: d.isChosen ? `${accent}14` : "#FCF9F3",
              border: `1.5px solid ${d.isChosen ? accent : "#DED5C7"}`,
              borderRadius: 8,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 9, height: 9, background: d.color, borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#e7e9ee" }}>{d.label}</span>
              {d.isChosen && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: "#000",
                    background: accent,
                    padding: "3px 8px",
                    borderRadius: 4,
                  }}
                >
                  ✓ CHOSEN
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <MiniBar value={d.speed} color={d.color} label="Speed" />
              <MiniBar value={d.risk} color="#8b93a3" label="Risk" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Initiatives({ initiatives }: { initiatives: Initiative[]; accent: string }) {
  const sorted = [...initiatives].sort((a, b) => b.impact - a.impact);
  return (
    <Section label="What we prioritized">
      <div style={{ display: "grid", gap: 10 }}>
        {sorted.map((it, i) => (
          <div key={i} style={{ background: "#FCF9F3", border: "1px solid #DED5C7", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ width: 9, height: 9, background: it.color, borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#e7e9ee" }}>{it.label}</span>
            </div>
            <div style={{ display: "flex", gap: 18 }}>
              <MiniBar value={it.impact} color={it.color} label="Impact" />
              <MiniBar value={it.effort} color="#8b93a3" label="Effort" />
              <MiniBar value={it.timeToValue} color="#8b93a3" label="Speed to value" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function Stakeholders({ stakeholders }: { stakeholders: Stakeholder[]; accent: string }) {
  return (
    <Section label="Stakeholders aligned">
      <div style={{ display: "grid", gap: 8 }}>
        {stakeholders.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            <span style={{ width: 10, height: 10, background: s.color, display: "inline-block", borderRadius: 2 }} />
            <span style={{ fontWeight: 700, color: "#e7e9ee" }}>{s.name}</span>
            <span style={{ color: "#7f8694" }}>· {s.role}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
