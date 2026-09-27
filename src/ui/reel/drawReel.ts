// Entry showreel, "The Datum" (build spec: section references below point at it).
//
// One coral hairline at the hero headline's second baseline. Every fact about
// Utku rises out of it or hangs from it, and at 14.5 s the frame stops as the
// real hero. drawReel is a pure function of (t, width, height, dpr): no state
// survives between calls except the memos in ./cache, which never change output.
//
// Value imports are allowed only from src/theme.ts and src/projects/projects.ts
// (through ./cache). Nothing here may come from src/world.

import { T } from "../../theme";
import { COPY, FIGURES, FONT, LOGO_QUADS, PRODUCTS, SIZE, getBackground, getLogo, getMetrics } from "./cache";
import type { Metrics, ProductMetrics } from "./cache";
import { clamp, inCubic, inOutCubic, inOutQuint, land, lerp, logLerp, outBack, outCubic, outExpo, outQuart, seg } from "./ease";
import { drawOdometer, drawStatics } from "./odometer";
import { CHART, DATUM_Y, LAYOUT as L, TIMELINE as TL, ledgerBaseline, productStart } from "./timeline";

export { TIMELINE, LAYOUT } from "./timeline";

export const REEL_DURATION = TL.duration;
export const REEL_REST = TL.rest;
export const SKIP_TARGET = TL.skip;
export const CTA_STAGE = { cx: 960, cy: 787.4, w: 258, h: 55 } as const;

/** Every visible string the reel paints (section 8), for the house-style test. */
export const REEL_COPY: readonly string[] = [
  COPY.name,
  COPY.title1,
  COPY.title2,
  COPY.title1 + COPY.titleJoin + COPY.title2,
  ...COPY.counters,
  ...COPY.counterLabels,
  ...COPY.heroLines,
  COPY.dot,
  ...PRODUCTS.flatMap((p) => [p.title, p.category, p.phrase]),
  ...PRODUCTS.flatMap((p) => {
    const f = FIGURES[p.id];
    return f.small ? [f.str, f.small] : [f.str];
  }),
  // Figures' starting states: Mestores 0.8%, La3eb 1×, Upshift 8% (BiLira and Apollo start at 0).
  "0%",
  "$0M",
  "0.8%",
  "1\u00D7",
  "8%",
];

/**
 * Warms the memos (glyph metrics, background bitmap) so the first animated frame
 * does not pay for them. Call once, after the fonts have loaded.
 */
export function prepareReel(ctx: CanvasRenderingContext2D): void {
  getBackground(ctx.canvas.width, ctx.canvas.height);
  getMetrics(ctx);
}

/** Section 2.1: contain the 1920 x 1080 stage, never upscaled past 1x. */
export function stageTransform(width: number, height: number): { s: number; ox: number; oy: number } {
  const s = Math.min(1, width / 1280, height / 720);
  return { s, ox: width / 2 - 960 * s, oy: height / 2 - 540 * s };
}

// ---------------------------------------------------------------------------
// Frame plumbing

interface Frame {
  ctx: CanvasRenderingContext2D;
  m: Metrics;
  t: number; // animation time, already clamped to REEL_REST
  a: number; // stage scale in device px
  e: number;
  f: number;
  vx0: number;
  vx1: number;
  vy0: number;
  vy1: number;
  font: string; // frame-local: avoids redundant font sets
  fill: string;
}

const stage = (fr: Frame) => fr.ctx.setTransform(fr.a, 0, 0, fr.a, fr.e, fr.f);

function setFont(fr: Frame, f: string) {
  if (fr.font !== f) {
    fr.ctx.font = f;
    fr.font = f;
  }
}
function setFill(fr: Frame, c: string) {
  if (fr.fill !== c) {
    fr.ctx.fillStyle = c;
    fr.fill = c;
  }
}

/** Opens a clip; pair with endClip. Resets the frame-local style memo. */
function clipBox(fr: Frame, x0: number, y0: number, x1: number, y1: number) {
  const c = fr.ctx;
  c.save();
  c.beginPath();
  c.rect(x0, y0, x1 - x0, y1 - y0);
  c.clip();
}
function endClip(fr: Frame) {
  fr.ctx.restore();
  // restore() brings back the saved font and fill, which our memo may not know.
  fr.font = fr.ctx.font;
  fr.fill = fr.ctx.fillStyle as string;
}

/**
 * M_ABOVE: from the mask top down to y1, except the RESUME corner, where the
 * top drops to resumeY1. Pair with endClip.
 */
function clipAbove(fr: Frame, y1: number) {
  const c = fr.ctx;
  c.save();
  c.beginPath();
  c.rect(fr.vx0, L.aboveY0, L.resumeX0 - fr.vx0, y1 - L.aboveY0);
  c.rect(L.resumeX0, L.resumeY1, fr.vx1 - L.resumeX0, y1 - L.resumeY1);
  c.clip();
}

/**
 * Bottom of the rising-copy clip for a glyph dy px below rest: the datum while it
 * rises, opening to the descender allowance over its last 4 px of travel.
 */
const aboveFloor = (dy: number) => DATUM_Y + L.descender * clamp(1 - dy / 4, 0, 1);

/** Carried text: drawn from a cached reference size under a scale about (x, baseline). */
function scaledText(fr: Frame, s: string, x: number, y: number, k: number) {
  const a = fr.a * k;
  fr.ctx.setTransform(a, 0, 0, a, fr.e + fr.a * x, fr.f + fr.a * y);
  fr.ctx.fillText(s, 0, 0);
  stage(fr);
}

const rise = (d: number, p: number) => d * (1 - outExpo(p));
const rollOut = (p: number) => -L.rollOutD * inCubic(p);
const sinkUp = (p: number) => -L.sinkD * inCubic(p);

// ---------------------------------------------------------------------------
// Datum (shots 1, 10, 11)

interface DatumState {
  x0: number;
  x1: number;
  y: number;
}

function datumState(fr: Frame): DatumState {
  const tt = fr.t;
  const h1x0 = fr.m.h1X2;
  const h1x1 = fr.m.h1X2 + fr.m.h1W2;
  let x0 = fr.vx0;
  let x1 = fr.vx1;
  let y = DATUM_Y;
  if (tt < TL.datumGrow[1]) {
    x1 = fr.vx0 + (fr.vx1 - fr.vx0) * outExpo(seg(tt, TL.datumGrow[0], TL.datumGrow[1]));
  } else if (tt > TL.datumContract[0]) {
    const e = inOutCubic(seg(tt, TL.datumContract[0], TL.datumContract[1]));
    x0 = lerp(fr.vx0, h1x0, e);
    x1 = lerp(fr.vx1, h1x1, e);
    if (tt > TL.datumDrop[0]) y = lerp(DATUM_Y, L.dropY, inOutCubic(seg(tt, TL.datumDrop[0], TL.datumDrop[1])));
    if (tt > TL.handoffNarrow[0]) {
      const n = inOutCubic(seg(tt, TL.handoffNarrow[0], TL.handoffNarrow[1]));
      y = lerp(L.dropY, L.ctaLineY, n);
      x0 = lerp(h1x0, L.ctaX0, n);
      x1 = lerp(h1x1, L.ctaX1, n);
    }
    if (tt > TL.handoffConsume[0]) {
      const c = inCubic(seg(tt, TL.handoffConsume[0], TL.handoffConsume[1]));
      x0 = lerp(L.ctaX0, L.ctaCenterX, c);
      x1 = lerp(L.ctaX1, L.ctaCenterX, c);
    }
  }
  return { x0, x1, y };
}

function drawDatum(fr: Frame, d: DatumState) {
  const c = fr.ctx;
  setFill(fr, T.coral);
  if (d.x1 - d.x0 > 1e-3) c.fillRect(d.x0, d.y, d.x1 - d.x0, L.datumH);
  // Shot 4 landing ticks: the datum thickens under each counter as it lands.
  const tt = fr.t;
  for (let i = 0; i < 3; i++) {
    const at = TL.counterLand[i];
    if (tt < at || tt >= at + TL.tickDur) continue;
    const extra = 2 * (1 - outCubic(seg(tt, at, at + TL.tickDur)));
    if (extra > 1e-3) c.fillRect(L.counterX[i], DATUM_Y + L.datumH, fr.m.counterW[i], extra);
  }
}

// Knife: each product's accent blade sweeps the measure onto its downbeat.
function drawKnives(fr: Frame) {
  for (let k = 0; k < PRODUCTS.length; k++) {
    const u = fr.t - productStart(k);
    if (u <= TL.knifeU[0] || u >= TL.knifeU[1]) continue;
    const x = L.knifeX0 + L.knifeTravel * inOutCubic(seg(u, TL.knifeU[0], TL.knifeU[1]));
    const x0 = Math.max(x, L.measureX0);
    const x1 = Math.min(x + L.knifeW, L.measureX1);
    if (x1 <= x0) continue;
    setFill(fr, PRODUCTS[k].accent);
    fr.ctx.fillRect(x0, L.knifeY, x1 - x0, L.knifeH);
  }
}

// ---------------------------------------------------------------------------
// Logo (shots 1, 2, 10)

function drawLogo(fr: Frame) {
  const tt = fr.t;
  const H = L.logoHero;
  const M = L.logoMast;
  let x: number = H.x;
  let y: number = H.y;
  let size: number = H.size;
  if (tt > TL.logoDock[0] && tt <= TL.logoHome[0]) {
    const e = inOutQuint(seg(tt, TL.logoDock[0], TL.logoDock[1]));
    x = lerp(H.x, M.x, e);
    y = lerp(H.y, M.y, e);
    size = logLerp(H.size, M.size, e);
  } else if (tt > TL.logoHome[0]) {
    const e = inOutQuint(seg(tt, TL.logoHome[0], TL.logoHome[1]));
    x = lerp(M.x, H.x, e);
    y = lerp(M.y, H.y, e) + L.logoHomeArc * Math.sin(Math.PI * e);
    size = logLerp(M.size, H.size, e);
  }
  const paths = getLogo();
  const k = size / 96;
  const c = fr.ctx;
  for (let q = 0; q < 4; q++) {
    const start = TL.stamps[q];
    if (tt < start) continue;
    const quad = LOGO_QUADS[q];
    const sc = 0.6 + 0.4 * outBack(seg(tt, start, start + TL.stampDur));
    const a = fr.a * k * sc;
    c.setTransform(a, 0, 0, a, fr.e + fr.a * (x + k * quad.cx * (1 - sc)), fr.f + fr.a * (y + k * quad.cy * (1 - sc)));
    c.fillStyle = quad.color;
    c.fill(paths[quad.key]);
  }
  fr.fill = c.fillStyle as string;
  stage(fr);
}

// ---------------------------------------------------------------------------
// Name (shot 1 rise, shot 2 dock to masthead, shot 10 flight to the hero eyebrow)

const nameDockStart = (j: number) => TL.nameDockStart + TL.nameDockStagger * j;

/** Shot 1: glyphs rise through M_ABOVE; ACIKGOZ closes its tracking. Drawn inside the M_ABOVE clip. */
function drawNameRise(fr: Frame) {
  const tt = fr.t;
  if (tt < TL.nameUtku[0] || tt > nameDockStart(fr.m.nameRun.ch.length - 1)) return;
  const run = fr.m.nameRun;
  const extra = L.nameTrackExtra * (1 - outQuart(seg(tt, TL.nameTrack[0], TL.nameTrack[1])));
  setFont(fr, FONT.name);
  setFill(fr, T.text);
  for (let j = 0; j < run.ch.length; j++) {
    if (j === 4) continue; // the space
    if (tt > nameDockStart(j)) continue; // carried
    const span = j < 4 ? TL.nameUtku : TL.nameAcik;
    if (tt < span[0]) continue;
    const dy = rise(L.nameRise, seg(tt, span[0], span[1]));
    const x = fr.m.nameFitX[j] + (j > 4 ? (j - 5) * extra : 0);
    fr.ctx.fillText(run.ch[j], x, DATUM_Y + dy);
  }
}

/** Shot 2 onward: each glyph flies to the masthead eyebrow, then home to the hero eyebrow. Unclipped. */
function drawNameCarry(fr: Frame) {
  const tt = fr.t;
  const m = fr.m;
  const run = m.nameRun;
  if (tt <= nameDockStart(0)) return;
  for (let j = 0; j < run.ch.length; j++) {
    if (j === 4) continue;
    const ds = nameDockStart(j);
    if (tt <= ds) continue;
    const ch = run.ch[j];
    if (tt <= TL.eyebrowHome[0]) {
      const p = seg(tt, ds, ds + TL.nameDockDur);
      if (p < 1) {
        const e = inOutQuint(p);
        const late = e >= 0.5; // hard switch mid-flight, under 52 px and moving fast
        setFont(fr, late ? FONT.ref700 : FONT.ref800);
        setFill(fr, late ? T.textMuted : T.text);
        const size = logLerp(SIZE.name, SIZE.mastEyebrow, e);
        scaledText(fr, ch, lerp(m.nameFitX[j], m.mastX[j], e), lerp(DATUM_Y, L.mastEyebrowBaseline, e), size / SIZE.ref);
      } else {
        setFont(fr, FONT.mastEyebrow);
        setFill(fr, T.textMuted);
        fr.ctx.fillText(ch, m.mastX[j], L.mastEyebrowBaseline);
      }
    } else {
      const p = seg(tt, TL.eyebrowHome[0], TL.eyebrowHome[1]);
      setFill(fr, T.textMuted);
      if (p < 1) {
        const e = inOutQuint(p);
        setFont(fr, FONT.ref700);
        const size = logLerp(SIZE.mastEyebrow, SIZE.heroEyebrow, e);
        scaledText(fr, ch, lerp(m.mastX[j], m.heroEyebrowX[j], e), lerp(L.mastEyebrowBaseline, L.heroEyebrowBaseline, e), size / SIZE.ref);
      } else {
        setFont(fr, FONT.heroEyebrow);
        fr.ctx.fillText(ch, m.heroEyebrowX[j], L.heroEyebrowBaseline);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Title (shot 2 slices, shot 3 hold, shot 4 dock, shot 10 flight to the h1)

function drawTitleLine(fr: Frame, s: string, baseline: number, bands: readonly number[], starts: readonly number[], dockAt: number) {
  const tt = fr.t;
  if (tt < starts[0] || tt > dockAt) return;
  setFont(fr, FONT.title);
  setFill(fr, T.text);
  if (tt >= starts[2] + TL.bandDur) {
    fr.ctx.fillText(s, L.titleX, baseline);
    return;
  }
  for (let b = 0; b < 3; b++) {
    const st = starts[b];
    if (tt < st) continue;
    const dir = b === 1 ? -1 : 1;
    const off = dir * L.bandOffset * (1 - outExpo(seg(tt, st, st + TL.bandDur)));
    clipBox(fr, L.measureX0, bands[b], L.measureX1, bands[b + 1]);
    fr.ctx.fillText(s, L.titleX + off, baseline);
    endClip(fr);
  }
}

function drawTitleBands(fr: Frame) {
  drawTitleLine(fr, COPY.title2, L.title2Baseline, L.title2Bands, TL.bandsLine2, TL.titleDock2[0]);
  drawTitleLine(fr, COPY.title1, L.title1Baseline, L.title1Bands, TL.bandsLine1, TL.titleDock1[0]);
}

function drawTitleCarry(fr: Frame, s: string, fromX: number, fromY: number, mastX: number, dock: readonly [number, number], home: readonly [number, number], heroX: number, heroY: number) {
  const tt = fr.t;
  if (tt <= dock[0]) return;
  setFill(fr, T.text);
  if (tt < dock[1]) {
    const e = inOutQuint(seg(tt, dock[0], dock[1]));
    setFont(fr, FONT.title);
    scaledText(fr, s, lerp(fromX, mastX, e), lerp(fromY, L.mastTitleBaseline, e), logLerp(SIZE.title, SIZE.mastTitle, e) / SIZE.title);
  } else if (tt <= home[0]) {
    setFont(fr, FONT.mastTitle);
    fr.ctx.fillText(s, mastX, L.mastTitleBaseline);
  } else if (tt < home[1]) {
    const e = inOutQuint(seg(tt, home[0], home[1]));
    setFont(fr, FONT.ref800);
    scaledText(fr, s, lerp(mastX, heroX, e), lerp(L.mastTitleBaseline, heroY, e), logLerp(SIZE.mastTitle, SIZE.h1, e) / SIZE.ref);
  } else {
    setFont(fr, FONT.h1);
    fr.ctx.fillText(s, heroX, heroY);
  }
}

function drawTitleCarries(fr: Frame) {
  const m = fr.m;
  drawTitleCarry(fr, COPY.title1, L.titleX, L.title1Baseline, L.mastTitleX, TL.titleDock1, TL.h1Home1, m.h1X1, L.h1Baseline1);
  drawTitleCarry(fr, COPY.title2, L.titleX, L.title2Baseline, L.mastTitleX + m.mastWsp, TL.titleDock2, TL.h1Home2, m.h1X2, L.h1Baseline2);
}

// ---------------------------------------------------------------------------
// Counters (shot 4, exit in shot 5)

function drawCounterNumerals(fr: Frame) {
  const tt = fr.t;
  for (let i = 0; i < 3; i++) {
    const r0 = TL.counterRise[i];
    const at = TL.counterLand[i];
    const ex = TL.counterExit[i];
    if (tt < r0 || tt > ex + TL.rollOut) continue;
    const o = fr.m.counters[i];
    const out = rollOut(seg(tt, ex, ex + TL.rollOut));
    const dy = rise(L.riseD, seg(tt, r0, r0 + TL.counterRiseDur)) + out;
    const value = COPY.counterValues[i] * outExpo(seg(tt, r0, at));
    const bounce = tt >= at ? land(tt - at) : 0;
    setFont(fr, FONT.counter);
    setFill(fr, T.mauve);
    drawOdometer(fr.ctx, o, L.counterX[i], DATUM_Y + dy, value, bounce);
    // The suffix is a static glyph of the final string, so it rides with the
    // numerals and each counter reads whole the moment it lands.
    drawStatics(fr.ctx, o, L.counterX[i], DATUM_Y + dy);
  }
}

function drawCounterLabels(fr: Frame) {
  const tt = fr.t;
  for (let i = 0; i < 3; i++) {
    const at = TL.counterLand[i];
    const ex = TL.counterExit[i];
    if (tt < at || tt > ex + TL.sink) continue;
    const dy = -L.dropD * (1 - outExpo(seg(tt, at, at + TL.labelDur))) + sinkUp(seg(tt, ex, ex + TL.sink));
    setFont(fr, FONT.counterLabel);
    setFill(fr, T.textMuted);
    fr.ctx.fillText(COPY.counterLabels[i], L.counterX[i], L.counterLabelBaseline + dy);
  }
}

// ---------------------------------------------------------------------------
// Products (shots 5 to 9)

const BAR_TOP = CHART.top;
const BAR_H = CHART.height;
const MESTORES_H0 = (BAR_H * CHART.mestores.fromValue) / CHART.mestores.toValue; // 106.67
const APOLLO_REST_Y = DATUM_Y - CHART.apollo.size; // 405

// Chart geometry as functions of u, shared by the chart and the figure it proves.
const biliraScanY = (u: number) => BAR_TOP + (CHART.bilira.cutY - BAR_TOP) * inOutCubic(seg(u, TL.biliraScanU[0], TL.biliraScanU[1]));
const mestoresH = (u: number) => MESTORES_H0 + (BAR_H - MESTORES_H0) * inOutCubic(seg(u, TL.mestoresGrowU[0], TL.mestoresGrowU[1]));
const apolloE1 = (u: number) => outCubic(seg(u, TL.apolloBlock1U[0], TL.apolloBlock1U[1]));
const apolloE2 = (u: number) => outCubic(seg(u, TL.apolloBlock2U[0], TL.apolloBlock2U[1]));
const la3ebT2 = (u: number) => outExpo(seg(u, TL.la3ebT2U[0], TL.la3ebT2U[1]));
const la3ebT3 = (u: number) => outExpo(seg(u, TL.la3ebT3U[0], TL.la3ebT3U[1]));
const la3ebGrow = (u: number, c: number) => outExpo(seg(u, TL.la3ebGrowU[c], TL.la3ebGrowU[c] + TL.la3ebGrowDur));
const upshiftFold = (u: number) => inOutCubic(seg(u, TL.upshiftFoldU[0], TL.upshiftFoldU[1]));

/** How far each chart's geometry has travelled from its "from" state to its "to" state, 0..1. */
function chartProgress(id: string, u: number): number {
  switch (id) {
    case "bilira":
      return u < TL.biliraScanU[0] ? 0 : (biliraScanY(u) - BAR_TOP) / (CHART.bilira.cutY - BAR_TOP);
    case "mestores":
      return (mestoresH(u) - MESTORES_H0) / (BAR_H - MESTORES_H0);
    case "apollo":
      return (apolloE1(u) + apolloE2(u)) / 2; // two $1M blocks
    case "la3eb":
      return (la3ebT2(u) + la3ebT3(u) + la3ebGrow(u, 0) + la3ebGrow(u, 1) + la3ebGrow(u, 2)) / 5; // five new tiles
    case "upshift":
      return upshiftFold(u);
    default:
      return 0;
  }
}

/** The figure's value, read off its chart (units of the least significant place). */
function figureValue(p: ProductMetrics, u: number): number {
  return lerp(p.from, p.to, chartProgress(p.id, u));
}

const exitU = (k: number) => TL.exitU[k];

function drawProductAbove(fr: Frame, k: number) {
  const u = fr.t - productStart(k);
  const ux = exitU(k);
  const p = fr.m.products[k];
  const c = fr.ctx;
  if (u >= TL.nameInU[0] && u <= ux + TL.rollOut) {
    const dy = rise(L.riseD, seg(u, TL.nameInU[0], TL.nameInU[1])) + rollOut(seg(u, ux, ux + TL.rollOut));
    clipAbove(fr, aboveFloor(dy));
    setFont(fr, FONT.product);
    setFill(fr, T.text);
    c.fillText(p.title, L.productNameX, DATUM_Y + dy);
    endClip(fr);
  }
  const fx = ux + TL.figureOutDelay;
  const fin = p.from === 0 ? TL.figureInZeroU : TL.figureInU;
  if (u >= fin[0] && u <= fx + TL.rollOut) {
    const dy = rise(L.riseD, seg(u, fin[0], fin[1])) + rollOut(seg(u, fx, fx + TL.rollOut));
    clipAbove(fr, aboveFloor(dy));
    setFont(fr, FONT.figure);
    setFill(fr, p.ink);
    drawOdometer(c, p.figure, p.figureX, DATUM_Y + dy, figureValue(p, u), 0);
    drawStatics(c, p.figure, p.figureX, DATUM_Y + dy);
    if (p.small) {
      setFont(fr, FONT.figureSmall);
      c.fillText(p.small, p.smallX, DATUM_Y + dy);
    }
    endClip(fr);
  }
}

function drawProductBelow(fr: Frame, k: number) {
  const u = fr.t - productStart(k);
  const ux = exitU(k);
  const p = fr.m.products[k];
  const c = fr.ctx;
  if (u >= TL.categoryInU[0] && u <= ux + TL.sink) {
    const dy = -L.dropD * (1 - outExpo(seg(u, TL.categoryInU[0], TL.categoryInU[1]))) + sinkUp(seg(u, ux, ux + TL.sink));
    setFont(fr, FONT.category);
    setFill(fr, T.textSoft);
    c.fillText(p.category, L.productNameX, L.categoryBaseline + dy);
  }
  if (u >= TL.phraseInU[0] && u <= ux) {
    const dy = -L.dropD * (1 - outExpo(seg(u, TL.phraseInU[0], TL.phraseInU[1])));
    setFont(fr, FONT.phrase);
    setFill(fr, p.ink);
    c.fillText(p.phrase, L.productNameX, L.phraseBaseline + dy);
  }
}

/**
 * FILE: the phrase carries into its ledger row. It shrinks and shifts early and
 * descends late, so it is row sized and clear of the CTA before it reaches the
 * ledger, and it passes behind the rows already filed rather than over them.
 */
function drawPhraseFile(fr: Frame, k: number) {
  const u = fr.t - productStart(k);
  const ux = exitU(k);
  if (u <= ux || u >= ux + TL.fileDur) return;
  const p = fr.m.products[k];
  const q = seg(u, ux, ux + TL.fileDur);
  const ex = outCubic(q);
  const ey = inOutCubic(q);
  const c = fr.ctx;
  const occlude = k > 0;
  if (occlude) {
    // Everything except the band of filed rows (even-odd: the band is a hole).
    const y0 = ledgerBaseline(0) - L.ledgerPitch + L.rowMaskPad;
    const y1 = ledgerBaseline(k - 1) + L.rowMaskPad;
    c.save();
    c.beginPath();
    c.rect(fr.vx0, fr.vy0, fr.vx1 - fr.vx0, fr.vy1 - fr.vy0);
    c.rect(fr.vx0, y0, fr.vx1 - fr.vx0, y1 - y0);
    c.clip("evenodd");
  }
  setFont(fr, FONT.phrase);
  setFill(fr, p.ink);
  scaledText(fr, p.phrase, lerp(L.productNameX, p.phraseX, ex), lerp(L.phraseBaseline, p.ledgerY, ey), logLerp(SIZE.phrase, SIZE.ledger, ex) / SIZE.phrase);
  if (occlude) endClip(fr);
}

function strokeInside(fr: Frame, x0: number, y0: number, x1: number, y1: number, color: string) {
  const c = fr.ctx;
  const h = L.ledgerStroke / 2;
  c.strokeStyle = color;
  c.lineWidth = L.ledgerStroke;
  c.strokeRect(x0 + h, y0 + h, x1 - x0 - 2 * h, y1 - y0 - 2 * h);
}

function drawChart(fr: Frame, k: number) {
  const u = fr.t - productStart(k);
  const ux = exitU(k);
  const cx = ux + TL.chartOutDelay;
  if (u < TL.chartInU[0] || u > cx + TL.rollOut) return;
  const p = fr.m.products[k];
  const dy = rollOut(seg(u, cx, cx + TL.rollOut));
  const inP = seg(u, TL.chartInU[0], TL.chartInU[1]);
  const c = fr.ctx;
  clipBox(fr, L.chartX0, L.chartY0, L.chartX1, DATUM_Y);
  switch (p.id) {
    case "bilira":
      drawBilira(fr, p, u, dy, inP);
      break;
    case "mestores": {
      const r = rise(MESTORES_H0, inP);
      const h = mestoresH(u);
      const M = CHART.mestores;
      setFill(fr, T.surface);
      c.fillRect(M.beforeX0, DATUM_Y - MESTORES_H0 + r + dy, M.beforeX1 - M.beforeX0, MESTORES_H0);
      setFill(fr, p.accent);
      c.fillRect(M.afterX0, DATUM_Y - h + r + dy, M.afterX1 - M.afterX0, h);
      if (u >= TL.mestoresGrowU[0]) {
        setFill(fr, T.border);
        c.fillRect(M.beforeX0, DATUM_Y - MESTORES_H0 - 0.5 + dy, M.afterX1 - M.beforeX0, 1);
      }
      break;
    }
    case "apollo": {
      const A = CHART.apollo;
      const e1 = apolloE1(u);
      const e2 = apolloE2(u);
      setFill(fr, p.accent);
      if (u >= TL.apolloBlock1U[0]) c.fillRect(A.x0, APOLLO_REST_Y + A.size * (1 - e1) - (A.size + A.gap) * e2 + dy, A.size, A.size);
      if (u >= TL.apolloBlock2U[0]) c.fillRect(A.x0, APOLLO_REST_Y + (A.size + A.gap) * (1 - e2) + dy, A.size, A.size);
      break;
    }
    case "la3eb": {
      const G = CHART.la3eb;
      setFill(fr, p.accent);
      // T3 and T2 slide out from under T1, so they are painted first.
      if (u >= TL.la3ebT3U[0]) c.fillRect(G.cols[0] + (G.cols[2] - G.cols[0]) * la3ebT3(u), G.bottomY + dy, G.size, G.size);
      if (u >= TL.la3ebT2U[0]) c.fillRect(G.cols[0] + (G.cols[1] - G.cols[0]) * la3ebT2(u), G.bottomY + dy, G.size, G.size);
      c.fillRect(G.cols[0], G.bottomY + rise(G.size, inP) + dy, G.size, G.size);
      for (let col = 0; col < 3; col++) {
        const st = TL.la3ebGrowU[col];
        if (u < st) continue;
        const g = la3ebGrow(u, col);
        const y = G.topY + G.grow * (1 - g) + dy;
        if (g < 1) {
          // Rises out of the top edge of the tile below it.
          clipBox(fr, G.cols[col], L.chartY0, G.cols[col] + G.size, G.bottomY + dy);
          c.fillRect(G.cols[col], y, G.size, G.size);
          endClip(fr);
        } else {
          c.fillRect(G.cols[col], y, G.size, G.size);
        }
      }
      break;
    }
    case "upshift":
      drawUpshift(fr, p, u, dy, inP);
      break;
  }
  endClip(fr);
}

function drawBilira(fr: Frame, p: ProductMetrics, u: number, dy: number, inP: number) {
  const c = fr.ctx;
  const B = CHART.bilira;
  const w = B.x1 - B.x0;
  setFill(fr, p.accent);
  if (u < TL.biliraSliceU[0]) {
    c.fillRect(B.x0, BAR_TOP + rise(BAR_H, inP) + dy, w, BAR_H);
  } else {
    c.fillRect(B.x0, B.cutY + dy, w, DATUM_Y - B.cutY);
    strokeInside(fr, B.x0, BAR_TOP + dy, B.x1, B.cutY + dy, T.border);
    if (u < TL.biliraSliceU[1]) {
      const lift = -B.sliceLift * inCubic(seg(u, TL.biliraSliceU[0], TL.biliraSliceU[1]));
      c.fillRect(B.x0, BAR_TOP + lift + dy, w, B.cutY - BAR_TOP);
    }
  }
  if (u >= TL.biliraScanU[0] && u < TL.biliraCutU[1]) {
    const y = biliraScanY(u);
    const th = u >= TL.biliraCutU[0] ? B.cutH : B.scanH;
    setFill(fr, T.text);
    c.fillRect(B.scanX0, y - th / 2 + dy, B.scanX1 - B.scanX0, th);
  }
}

function drawUpshift(fr: Frame, p: ProductMetrics, u: number, dy: number, inP: number) {
  const c = fr.ctx;
  const U = CHART.upshift;
  const w = U.x1 - U.x0;
  const half = DATUM_Y - U.hinge; // 140
  if (u < TL.upshiftFoldU[0]) {
    setFill(fr, p.accent);
    c.fillRect(U.x0, BAR_TOP + rise(BAR_H, inP) + dy, w, BAR_H);
    return;
  }
  strokeInside(fr, U.x0, BAR_TOP + dy, U.x1, U.hinge + dy, T.border);
  setFill(fr, p.accent);
  c.fillRect(U.x0, U.hinge + dy, w, half);
  if (u >= TL.upshiftFoldU[1]) return; // the flap lies on the lower half; its edge meets the datum
  const cos = Math.cos(Math.PI * upshiftFold(u));
  if (cos >= 0) {
    c.fillRect(U.x0, U.hinge - half * cos + dy, w, half * cos);
  } else {
    const hgt = half * -cos;
    c.fillRect(U.x0, U.hinge + dy, w, hgt);
    setFill(fr, T.forest);
    c.fillRect(U.x0, U.hinge + hgt - 2 + dy, w, 2);
  }
  setFill(fr, T.ink);
  c.fillRect(U.x0, U.hinge - 0.5 + dy, w, 1);
}

// ---------------------------------------------------------------------------
// Ledger (4.50 to 12.97; chips until they fly in shot 11)

function drawLedger(fr: Frame) {
  const tt = fr.t;
  if (tt < TL.ledgerIn) return;
  const c = fr.ctx;
  const m = fr.m;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const start = TL.ledgerIn + TL.ledgerStagger * i;
    if (tt < start) continue;
    const y = ledgerBaseline(i);
    const p = m.products[i];
    const pk = productStart(i);
    const filedAt = pk + exitU(i) + TL.fileDur;
    const state = tt >= filedAt ? 2 : tt >= pk ? 1 : 0; // empty, active, filed
    const r = L.ledgerRise * (1 - outExpo(seg(tt, start, start + TL.ledgerInDur)));
    const foldAt = TL.ledgerFold[i];
    const fold = L.ledgerRise * inCubic(seg(tt, foldAt, foldAt + TL.ledgerFoldDur));
    const textOn = tt < foldAt + TL.ledgerFoldDur;
    const chipOn = tt < TL.chipLaunch + TL.chipStagger * i;
    if (!textOn && !chipOn) continue;
    const clipped = r > 0 || fold > 0;
    if (clipped) clipBox(fr, fr.vx0, fr.vy0, fr.vx1, y + L.rowMaskPad);
    if (chipOn) {
      const cy = y - L.ledgerChipTop + r;
      if (state === 2) {
        setFill(fr, p.accent);
        c.fillRect(L.ledgerChipX, cy, L.ledgerChip, L.ledgerChip);
      } else {
        strokeInside(fr, L.ledgerChipX, cy, L.ledgerChipX + L.ledgerChip, cy + L.ledgerChip, state === 1 ? p.accent : T.border);
      }
    }
    if (textOn) {
      setFont(fr, FONT.ledgerName);
      setFill(fr, state === 0 ? T.border : T.text);
      c.fillText(p.title, L.ledgerNameX, y + r + fold);
      if (state === 2) {
        setFont(fr, FONT.ledgerPhrase);
        setFill(fr, p.ink);
        c.fillText(p.phrase, p.phraseX, y + r + fold);
      }
    }
    if (clipped) endClip(fr);
  }
}

/** Shot 11: five filed chips fly into the `11+` ones slot as its first five ticks. */
function drawChipFlights(fr: Frame) {
  const tt = fr.t;
  if (tt < TL.chipLaunch) return;
  const tgt = fr.m.chipTarget;
  for (let k = 0; k < PRODUCTS.length; k++) {
    const t0 = TL.chipLaunch + TL.chipStagger * k;
    if (tt < t0 || tt >= t0 + TL.chipDur) continue;
    const e = inCubic(seg(tt, t0, t0 + TL.chipDur));
    const x0 = L.ledgerChipX + L.ledgerChip / 2;
    const y0 = ledgerBaseline(k) - L.ledgerChipTop + L.ledgerChip / 2;
    const cxp = (x0 + tgt.x) / 2;
    const cyp = (y0 + tgt.y) / 2 + L.chipArcLift;
    const q = 1 - e;
    const x = q * q * x0 + 2 * q * e * cxp + e * e * tgt.x;
    const y = q * q * y0 + 2 * q * e * cyp + e * e * tgt.y;
    const size = lerp(L.ledgerChip, L.chipFlightEnd, e);
    setFill(fr, PRODUCTS[k].accent);
    fr.ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

// ---------------------------------------------------------------------------
// The resolve layers (shot 11): hero line and proof row, revealed by the datum

function proofValues(tt: number): [number, number, number] {
  let v11 = 0;
  for (let k = 0; k < PRODUCTS.length; k++) {
    const impact = TL.chipLaunch + TL.chipStagger * k + TL.chipDur;
    v11 += outCubic(seg(tt, impact, impact + TL.chipTickDur));
  }
  v11 += 6 * outCubic(seg(tt, TL.proof11Roll[0], TL.proof11Roll[1]));
  return [v11, 100 * outCubic(seg(tt, TL.proof100[0], TL.proof100[1])), 8 * outCubic(seg(tt, TL.proof8[0], TL.proof8[1]))];
}

function drawResolve(fr: Frame, datumY: number) {
  const tt = fr.t;
  if (tt < TL.datumDrop[0]) return;
  const c = fr.ctx;
  const m = fr.m;
  const wiping = tt < TL.datumDrop[1];
  if (wiping) clipBox(fr, fr.vx0, fr.vy0, fr.vx1, datumY);
  setFont(fr, FONT.heroLine);
  setFill(fr, T.textSoft);
  c.fillText(COPY.heroLines[0], m.heroLineX[0], L.heroLineBaselines[0]);
  c.fillText(COPY.heroLines[1], m.heroLineX[1], L.heroLineBaselines[1]);
  setFont(fr, FONT.proofLabel);
  setFill(fr, T.textMuted);
  for (let i = 0; i < 3; i++) c.fillText(COPY.counterLabels[i], L.proofLabelX[i], L.proofBaseline);
  setFont(fr, FONT.dot);
  setFill(fr, T.border);
  c.fillText(COPY.dot, L.proofDotX[0], L.proofDotBaseline);
  c.fillText(COPY.dot, L.proofDotX[1], L.proofDotBaseline);
  if (wiping) endClip(fr);

  const starts = [TL.proof11From, TL.proof100[0], TL.proof8[0]];
  const values = proofValues(tt);
  setFont(fr, FONT.proofNum);
  setFill(fr, T.mauve);
  for (let i = 0; i < 3; i++) {
    if (tt < starts[i]) continue;
    drawOdometer(c, m.proofs[i], L.proofX[i], L.proofBaseline, values[i], 0);
  }
  if (tt >= TL.proofSuffix[0]) {
    const dy = L.proofSuffixRise * (1 - outExpo(seg(tt, TL.proofSuffix[0], TL.proofSuffix[1])));
    if (dy > 0) clipBox(fr, fr.vx0, fr.vy0, fr.vx1, L.proofSuffixClipY);
    for (let i = 0; i < 3; i++) drawStatics(c, m.proofs[i], L.proofX[i], L.proofBaseline + dy);
    if (dy > 0) endClip(fr);
  }
}

// ---------------------------------------------------------------------------

/**
 * Paints the reel at time t (seconds) onto a canvas whose CSS size is
 * width x height. The device pixel ratio is read from the backing store.
 */
export function drawReel(ctx: CanvasRenderingContext2D, t: number, width: number, height: number): void {
  const dpr = ctx.canvas.width / width;
  const tc = clamp(Number.isFinite(t) ? t : 0, 0, REEL_DURATION);
  const tt = Math.min(tc, REEL_REST);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(getBackground(ctx.canvas.width, ctx.canvas.height), 0, 0);

  const m = getMetrics(ctx);
  const { s, ox, oy } = stageTransform(width, height);
  const fr: Frame = {
    ctx,
    m,
    t: tt,
    a: dpr * s,
    e: dpr * ox,
    f: dpr * oy,
    vx0: -ox / s,
    vx1: (width - ox) / s,
    vy0: -oy / s,
    vy1: (height - oy) / s,
    font: "",
    fill: "",
  };
  stage(fr);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = FONT.name;
  fr.font = ctx.font;

  const datum = datumState(fr);
  drawDatum(fr, datum);
  drawKnives(fr);

  // Charts stand on the line inside M_CHART.
  for (let k = 0; k < PRODUCTS.length; k++) drawChart(fr, k);

  // M_ABOVE: copy that rises out of the datum. The name and the counters have
  // no descenders and are cut at the line; products clip per element.
  if (tt < productStart(PRODUCTS.length - 1) + exitU(PRODUCTS.length - 1) + 0.3) {
    clipAbove(fr, DATUM_Y);
    drawNameRise(fr);
    drawCounterNumerals(fr);
    endClip(fr);
    for (let k = 0; k < PRODUCTS.length; k++) drawProductAbove(fr, k);

    // M_BELOW: copy that hangs from the datum.
    clipBox(fr, fr.vx0, L.belowY0, fr.vx1, L.belowY1);
    drawCounterLabels(fr);
    for (let k = 0; k < PRODUCTS.length; k++) drawProductBelow(fr, k);
    endClip(fr);
  }

  drawLedger(fr);
  drawTitleBands(fr);
  drawLogo(fr);
  drawTitleCarries(fr);
  drawNameCarry(fr); // flying name glyphs sit above the title bands
  drawResolve(fr, datum.y);
  for (let k = 0; k < PRODUCTS.length; k++) drawPhraseFile(fr, k);
  drawChipFlights(fr);
}
