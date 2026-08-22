# Case-study visuals

How to put a chart in a case study. Every field here is typed in
[`src/content/types.ts`](../src/content/types.ts) and rendered by
[`src/ui/viz/index.tsx`](../src/ui/viz/index.tsx).

**These are SVG, not WebGL.** They render in the DOM drawer, shared by the world and the
flat map, so content parity is free and they stay accessible and keyboard-reachable. They
add no GL contexts. This file used to describe them as three.js scenes in
`src/components/`; that architecture was removed long ago.

## Where they go

A case study is a `CaseStudy` with `beats`. Beats follow the canonical arc: **Problem →
Constraints → Approach → Results → Learnings**. Each viz field is optional on any beat
and renders when present.

```ts
{
  id: "results",
  body: ["Prose paragraphs, one string per paragraph."],
  insight: "A sharp one-line takeaway, rendered as a callout.",
  metrics: [...],       // before/after bars
  decisions: [...],     // speed vs risk scatter
  initiatives: [...],   // effort vs impact scatter
  stakeholders: [...],  // who had to be brought along
}
```

Colors come from the palette in [`src/theme.ts`](../src/theme.ts). Do not invent hex
values: `docs/design-system.md` lists the approved ones and a test enforces it. Accents
rendered as **text** must go through `textAccent()` for contrast.

## The four shapes

### `metrics` — what moved

```ts
metrics: [
  { label: "AML review time", before: 100, after: 65, unit: "%", color: T.blue },
]
```
`before` and `after` are plotted as paired bars. Keep `unit` short; it is appended to the
value, not to the axis.

### `decisions` — the tradeoff space you actually operated in

```ts
decisions: [
  { label: "Ship fast, manual review", speed: 95, risk: 85, isChosen: false, color: T.coral },
  { label: "Automate with a human gate", speed: 60, risk: 30, isChosen: true, color: T.seafoam },
]
```
`speed` and `risk` are 0 to 100. Exactly one entry should carry `isChosen: true`: it is
drawn highlighted, and the chart's whole job is showing what you gave up.

### `initiatives` — what you sequenced and why

```ts
initiatives: [
  { label: "Risk scoring", effort: 40, impact: 90, timeToValue: 30, color: T.mauve },
]
```
`effort` and `impact` are 0 to 100 and place the point. `timeToValue` (days) sizes it, so
a fast win reads small and near, a long bet reads large and far.

### `stakeholders` — who had to be brought along

```ts
stakeholders: [
  { name: "Compliance", role: "Owns the license risk", color: T.gold },
]
```
Keep `role` to one line. It is the answer to "what did this person actually care about",
not a job title.

## Rules

- **No dashes in any visible string.** No em dash, en dash or minus sign, anywhere a
  reader can see it. Ranges read "8% to 4%". `src/content/house-style.test.ts` enforces
  this and will name the file you broke.
- **Numbers must be real.** The CV in `public/` and the registry are the source of truth;
  see "Content truth" in `CLAUDE.md` before writing any metric.
- A beat with no viz fields renders as prose. That is fine. Do not add a chart because
  the slot exists, add one because it carries the argument.
