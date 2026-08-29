import { CARD_H, CARD_W, coverRect, statLine, type RunStats } from "./share-card";
import { T } from "../theme";

// Draws the run card. Split from `share-card.ts` so everything testable stays
// testable: this half needs a real 2D canvas and is verified in a browser, the
// other half is arithmetic and copy and is verified in the suite.

const CAPTION = "Utku Acikgoz   ·   Senior Technical Product Manager";

/** Fills the sky the transparent WebGL canvas never drew, so the card is opaque. */
function paintSky(ctx: CanvasRenderingContext2D): void {
  const sky = ctx.createLinearGradient(0, 0, 0, CARD_H);
  sky.addColorStop(0, T.skyBlue);
  sky.addColorStop(1, T.water);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
}

/**
 * The band the words sit in. Without it the copy lands on whatever the ocean
 * happened to be doing and half of it disappears into a bright crest.
 */
function paintScrim(ctx: CanvasRenderingContext2D): void {
  const scrim = ctx.createLinearGradient(0, CARD_H * 0.52, 0, CARD_H);
  scrim.addColorStop(0, "rgba(21,17,16,0)");
  scrim.addColorStop(0.55, "rgba(21,17,16,0.74)");
  scrim.addColorStop(1, "rgba(21,17,16,0.94)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, CARD_H * 0.52, CARD_W, CARD_H * 0.48);
}

/**
 * Composites the captured frame with the run's numbers.
 *
 * The frame comes from a transparent canvas, so the sky is painted underneath
 * rather than assumed, and the frame is cropped to fill rather than stretched.
 * Resolves null if the browser cannot produce a blob, which the caller treats
 * as "no card" instead of shipping a broken download.
 */
export async function renderShareCard(
  frame: HTMLImageElement | null,
  stats: RunStats,
  url: string
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  paintSky(ctx);
  if (frame && frame.width > 0 && frame.height > 0) {
    const src = coverRect(frame.width, frame.height, CARD_W, CARD_H);
    ctx.drawImage(frame, src.x, src.y, src.w, src.h, 0, 0, CARD_W, CARD_H);
  }
  paintScrim(ctx);

  const font = '"Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = T.sand;
  ctx.font = `800 30px ${font}`;
  ctx.fillText("SURF RUN", 64, CARD_H - 208);

  ctx.fillStyle = T.text;
  ctx.font = `900 62px ${font}`;
  ctx.fillText(statLine(stats), 64, CARD_H - 134);

  ctx.fillStyle = T.textSoft;
  ctx.font = `700 30px ${font}`;
  ctx.fillText(CAPTION, 64, CARD_H - 84);

  ctx.fillStyle = T.seafoam;
  ctx.font = `800 28px ${font}`;
  ctx.fillText(url.replace(/^https?:\/\//, ""), 64, CARD_H - 40);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Turns a data URL from the WebGL canvas into something drawable. */
export function loadFrame(dataUrl: string | null): Promise<HTMLImageElement | null> {
  if (!dataUrl) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}
