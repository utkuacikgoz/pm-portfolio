// The reel's allowed memos (spec section 7): font strings, per-glyph advances
// measured once after the fonts load, the layout tables derived from the
// registry, the logo Path2Ds and the background bitmap. None of these change
// what a frame looks like; they only move work out of the frame loop.

import { T, textAccent } from "../../theme";
import { PUBLISHED_PROJECTS } from "../../projects/projects";
import { LAYOUT, ledgerBaseline } from "./timeline";

const font = (weight: number, size: number): string => `${weight} ${size}px "Plus Jakarta Sans", sans-serif`;

/** Type scale (section 2.5). Carries interpolate between these sizes. */
export const SIZE = {
  name: 168,
  ref: 100, // cached reference size for carried glyphs
  title: 150,
  counter: 132,
  counterLabel: 24,
  product: 104,
  figure: 144,
  figureSmall: 56,
  category: 28,
  phrase: 34,
  mastEyebrow: 16,
  mastTitle: 24,
  ledger: 20,
  heroEyebrow: 13,
  h1: 82,
  heroLine: 22,
  proofNum: 27,
  proofLabel: 13,
  dot: 18,
} as const;

/** Every font the reel sets, built once. Never build one in the frame path. */
export const FONT = {
  name: font(800, SIZE.name),
  ref800: font(800, SIZE.ref),
  ref700: font(700, SIZE.ref),
  title: font(800, SIZE.title),
  counter: font(800, SIZE.counter),
  counterLabel: font(600, SIZE.counterLabel),
  product: font(800, SIZE.product),
  figure: font(800, SIZE.figure),
  figureSmall: font(800, SIZE.figureSmall),
  category: font(600, SIZE.category),
  phrase: font(800, SIZE.phrase),
  mastEyebrow: font(700, SIZE.mastEyebrow),
  mastTitle: font(800, SIZE.mastTitle),
  ledgerName: font(700, SIZE.ledger),
  ledgerPhrase: font(800, SIZE.ledger),
  heroEyebrow: font(700, SIZE.heroEyebrow),
  h1: font(800, SIZE.h1),
  heroLine: font(400, SIZE.heroLine),
  proofNum: font(800, SIZE.proofNum),
  proofLabel: font(600, SIZE.proofLabel),
  dot: font(400, SIZE.dot),
} as const;

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

// Copy that is not in the registry (spec section 8).
export const COPY = {
  name: "UTKU ACIKGOZ",
  title1: "Senior Technical",
  title2: "Product Manager",
  titleJoin: " ", // the masthead reads the two lines as one
  counters: ["11+", "100K+", "8+"] as const,
  counterValues: [11, 100, 8] as const,
  counterDigits: [[1, 0], [2, 1, 0], [0]] as const,
  counterLabels: ["products shipped", "users reached", "years in product"] as const,
  heroLines: ["I lead teams building complex products, from fintech", "infrastructure to AI features for marketplaces."] as const,
  dot: "·",
} as const;

/** The reel's bespoke per-product figures. A registry test pins the ids. */
interface FigureDef {
  str: string; // the final figure string
  small?: string; // Apollo's `/yr`, set at FIGURE small
  digits: readonly number[]; // glyph index of each place, least significant first
  minPlaces: number;
  from: number; // in units of the least significant place
  to: number;
}
export const FIGURES: Record<string, FigureDef> = {
  bilira: { str: "35%", digits: [1, 0], minPlaces: 1, from: 0, to: 35 },
  mestores: { str: "2.1%", digits: [2, 0], minPlaces: 2, from: 8, to: 21 },
  apollo: { str: "$2M", small: "/yr", digits: [1], minPlaces: 1, from: 0, to: 2 },
  la3eb: { str: "6×", digits: [0], minPlaces: 1, from: 1, to: 6 },
  upshift: { str: "4%", digits: [0], minPlaces: 1, from: 8, to: 4 },
};
export const REEL_PRODUCT_IDS = ["bilira", "mestores", "apollo", "la3eb", "upshift"] as const;

const TAGLINE_SEP = " · ";

/**
 * Registry rows the reel reads, split once. Pure strings: safe at import time.
 * Only rows with a choreographed figure are taken, so publishing a sixth project
 * cannot crash the hero; the registry test is what fails loudly instead.
 */
export const PRODUCTS = PUBLISHED_PROJECTS.filter((p) => Object.hasOwn(FIGURES, p.id)).map((p) => {
  const cut = p.tagline.indexOf(TAGLINE_SEP);
  return {
    id: p.id,
    title: p.title,
    category: cut < 0 ? p.tagline : p.tagline.slice(0, cut),
    phrase: cut < 0 ? "" : p.tagline.slice(cut + TAGLINE_SEP.length),
    accent: p.accent,
    ink: textAccent(p.accent),
  };
});

// ---------------------------------------------------------------------------
// Measurement

/** A run of glyphs: x[i] is the glyph's left offset, adv[i] its kerned advance. */
export interface Run {
  s: string;
  ch: readonly string[];
  x: readonly number[];
  adv: readonly number[];
  w: number;
}

function measureRun(ctx: CanvasRenderingContext2D, f: string, s: string): Run {
  ctx.font = f;
  const ch = Array.from(s);
  const x: number[] = [];
  const adv: number[] = [];
  // Prefix differences, so the advances carry the font's kerning and sum to the
  // natural width exactly.
  let prev = 0;
  let prefix = "";
  for (const c of ch) {
    prefix += c;
    const w = ctx.measureText(prefix).width;
    x.push(prev);
    adv.push(w - prev);
    prev = w;
  }
  return { s, ch, x, adv, w: prev };
}

function digitWidths(ctx: CanvasRenderingContext2D, f: string): number[] {
  ctx.font = f;
  return DIGITS.map((d) => ctx.measureText(d).width);
}

/** A rolling number: the final string's slots plus the per-digit widths. */
export interface Odo {
  run: Run;
  digits: readonly number[];
  minPlaces: number;
  tracking: number;
  size: number;
  digitW: readonly number[];
  statics: readonly number[]; // glyph indices that never roll
}

function odo(ctx: CanvasRenderingContext2D, f: string, size: number, s: string, digits: readonly number[], minPlaces: number, tracking: number, dw: number[]): Odo {
  const run = measureRun(ctx, f, s);
  const statics: number[] = [];
  for (let i = 0; i < run.ch.length; i++) if (!digits.includes(i)) statics.push(i);
  return { run, digits, minPlaces, tracking, size, digitW: dw, statics };
}

export interface ProductMetrics {
  id: string;
  title: string;
  category: string;
  phrase: string;
  accent: string;
  ink: string;
  figure: Odo;
  figureX: number; // left edge of the figure (right aligned at 1600 as a unit)
  small: string | null;
  smallX: number;
  from: number;
  to: number;
  phraseX: number; // landing x of the phrase in its ledger row
  ledgerY: number;
}

export interface Metrics {
  nameRun: Run; // 800 168
  nameFitX: number[]; // x_fit(j)
  mastX: number[]; // eyebrow glyph x at 700 16, tracking 6
  heroEyebrowRun: Run; // 700 13
  heroEyebrowX: number[];
  mastWsp: number; // `Senior Technical ` at 800 24
  h1X1: number;
  h1X2: number;
  h1W2: number;
  heroLineX: number[];
  counters: Odo[];
  counterW: number[];
  proofs: Odo[];
  chipTarget: { x: number; y: number };
  products: ProductMetrics[];
}

let metricsMemo: Metrics | null = null;

/**
 * True once the face the reel measures is usable. Metrics measured against the
 * fallback font would be kept for the session, so they are only memoized after.
 */
function fontsReady(): boolean {
  if (typeof document === "undefined" || !document.fonts) return true;
  return document.fonts.check(`800 100px "Plus Jakarta Sans"`) && document.fonts.check(`400 22px "Plus Jakarta Sans"`);
}

/**
 * Built once, after the fonts load. The caller is expected to gate on the fonts
 * (and warm this with prepareReel); an early call measures but does not memoize.
 */
export function getMetrics(ctx: CanvasRenderingContext2D): Metrics {
  if (metricsMemo) return metricsMemo;
  const metrics = measureAll(ctx);
  if (fontsReady()) metricsMemo = metrics;
  return metrics;
}

function measureAll(ctx: CanvasRenderingContext2D): Metrics {
  const savedFont = ctx.font;
  const L = LAYOUT;

  const nameRun = measureRun(ctx, FONT.name, COPY.name);
  const n = nameRun.ch.length;
  const fit = (L.measureX1 - L.measureX0 - nameRun.w) / (n - 1);
  const nameFitX = nameRun.x.map((x, j) => L.nameX + x + j * fit);

  const mastRun = measureRun(ctx, FONT.mastEyebrow, COPY.name);
  const mastX = mastRun.x.map((x, j) => L.mastEyebrowX + x + j * L.mastEyebrowTracking);

  const heroEyebrowRun = measureRun(ctx, FONT.heroEyebrow, COPY.name);
  const heroTrackTotal = heroEyebrowRun.ch.length * L.heroEyebrowTracking; // CSS adds it after the last glyph too
  const heroX0 = L.heroEyebrowCenter - (heroEyebrowRun.w + heroTrackTotal) / 2;
  const heroEyebrowX = heroEyebrowRun.x.map((x, j) => heroX0 + x + j * L.heroEyebrowTracking);

  ctx.font = FONT.mastTitle;
  const mastWsp = ctx.measureText(COPY.title1 + COPY.titleJoin).width;
  ctx.font = FONT.h1;
  const h1W1 = ctx.measureText(COPY.title1).width;
  const h1W2 = ctx.measureText(COPY.title2).width;
  ctx.font = FONT.heroLine;
  const heroLineX = COPY.heroLines.map((s) => L.heroLineCenter - ctx.measureText(s).width / 2);

  const dCounter = digitWidths(ctx, FONT.counter);
  const counters = COPY.counters.map((s, i) => odo(ctx, FONT.counter, SIZE.counter, s, COPY.counterDigits[i], 1, 0, dCounter));
  const counterW = counters.map((o) => o.run.w);

  const dProof = digitWidths(ctx, FONT.proofNum);
  const proofs = COPY.counters.map((s, i) => odo(ctx, FONT.proofNum, SIZE.proofNum, s, COPY.counterDigits[i], 1, L.proofTracking, dProof));
  const p11 = proofs[0];
  ctx.font = FONT.proofNum;
  const capOne = ctx.measureText(DIGITS[1]).actualBoundingBoxAscent;
  const chipTarget = {
    x: L.proofX[0] + p11.run.x[1] + L.proofTracking + p11.run.adv[1] / 2,
    y: L.proofBaseline - capOne / 2,
  };

  const dFigure = digitWidths(ctx, FONT.figure);
  const products = PRODUCTS.map((p, k): ProductMetrics => {
    const def = FIGURES[p.id];
    const figure = odo(ctx, FONT.figure, SIZE.figure, def.str, def.digits, def.minPlaces, 0, dFigure);
    let smallW = 0;
    if (def.small) {
      ctx.font = FONT.figureSmall;
      smallW = ctx.measureText(def.small).width + L.figureSmallGap;
    }
    const figureX = L.figureRight - figure.run.w - smallW;
    ctx.font = FONT.ledgerName;
    const ledgerNameW = ctx.measureText(p.title).width;
    return {
      ...p,
      figure,
      figureX,
      small: def.small ?? null,
      smallX: figureX + figure.run.w + L.figureSmallGap,
      from: def.from,
      to: def.to,
      phraseX: L.ledgerNameX + ledgerNameW + L.ledgerPhraseGap,
      ledgerY: ledgerBaseline(k),
    };
  });

  ctx.font = savedFont;
  return {
    nameRun,
    nameFitX,
    mastX,
    heroEyebrowRun,
    heroEyebrowX,
    mastWsp,
    h1X1: L.h1Center - h1W1 / 2,
    h1X2: L.h1Center - h1W2 / 2,
    h1W2,
    heroLineX,
    counters,
    counterW,
    proofs,
    chipTarget,
    products,
  };
}

// ---------------------------------------------------------------------------
// Logo (public/utku-logo.svg, 96 unit box)

export interface LogoPaths {
  forest: Path2D;
  coral: Path2D;
  blue: Path2D;
  mauve: Path2D;
}
let logoMemo: LogoPaths | null = null;

export function getLogo(): LogoPaths {
  if (logoMemo) return logoMemo;
  const forest = new Path2D();
  forest.moveTo(48, 24);
  forest.arc(24, 24, 24, 0, Math.PI * 2);
  forest.rect(0, 0, 48, 24);
  const coral = new Path2D();
  coral.rect(48, 15, 48, 18);
  coral.rect(63, 0, 18, 48);
  const blue = new Path2D();
  blue.moveTo(96, 72);
  blue.arc(72, 72, 24, 0, Math.PI * 2);
  blue.rect(48, 48, 48, 24);
  const mauve = new Path2D();
  mauve.moveTo(0, 48);
  mauve.lineTo(48, 48);
  mauve.lineTo(24, 72);
  mauve.lineTo(48, 96);
  mauve.lineTo(0, 96);
  mauve.closePath();
  logoMemo = { forest, coral, blue, mauve };
  return logoMemo;
}

/** Quadrant order matches the stamp order: forest, coral, blue, mauve. */
export const LOGO_QUADS = [
  { key: "forest", color: T.forest, cx: 24, cy: 24 },
  { key: "coral", color: T.coral, cx: 72, cy: 24 },
  { key: "blue", color: T.blue, cx: 72, cy: 72 },
  { key: "mauve", color: T.mauve, cx: 24, cy: 72 },
] as const;

// ---------------------------------------------------------------------------
// Background (section 2.7): HeroIntro's CSS stack, rendered once per size.

/** HeroIntro's vignette edge. Not a theme token; it is HeroIntro's own constant. */
const BG_EDGE = "#0C0A09";

type Surface = HTMLCanvasElement | OffscreenCanvas;
interface BgMemo {
  w: number;
  h: number;
  surface: Surface;
}
let bgMemo: BgMemo | null = null;

function makeSurface(w: number, h: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** The opaque background bitmap at backing-store resolution. */
export function getBackground(bw: number, bh: number): Surface {
  if (bgMemo && bgMemo.w === bw && bgMemo.h === bh) return bgMemo.surface;
  const surface = makeSurface(bw, bh);
  const g = surface.getContext("2d", { alpha: false }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  const cx = 0.5 * bw;
  const cy = 0.42 * bh;
  const r = Math.hypot(0.5 * bw, 0.58 * bh);
  const base = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  base.addColorStop(0, T.inkRaised);
  base.addColorStop(0.62, T.ink);
  base.addColorStop(1, BG_EDGE);
  g.fillStyle = base;
  g.fillRect(0, 0, bw, bh);

  const glow = (gx: number, gy: number, color: string, clear: string, stop: number) => {
    const rx = 1.2 * bw;
    const ry = 0.8 * bh;
    g.setTransform(rx, 0, 0, ry, gx, gy);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, color);
    grad.addColorStop(stop, clear);
    grad.addColorStop(1, clear);
    g.fillStyle = grad;
    g.fillRect(-gx / rx, -gy / ry, bw / rx, bh / ry);
    g.setTransform(1, 0, 0, 1, 0, 0);
  };
  glow(0.5 * bw, 1.0 * bh, T.entranceGlow.blue, transparentOf(T.entranceGlow.blue), 0.52);
  glow(0.5 * bw, 0.08 * bh, T.entranceGlow.coral, transparentOf(T.entranceGlow.coral), 0.46);

  bgMemo = { w: bw, h: bh, surface };
  return surface;
}

/** rgba(r,g,b,a) with a = 0, so the glow fades in its own hue as CSS does. */
function transparentOf(rgba: string): string {
  return rgba.replace(/,\s*[\d.]+\)$/, ",0)");
}

