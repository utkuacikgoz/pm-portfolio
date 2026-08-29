// The run card: what a visitor can actually send someone.
//
// Nothing shareable used to leave this site. Someone could enjoy the surf run
// and have no image, no result and no link to show for it, which is the whole
// reason a portfolio that people like still does not travel. This module owns
// the parts of that card that are arithmetic and copy rather than pixels, so
// they can be tested without a canvas: the framing maths, the wording, the
// filename, and the decision about which sharing route a browser can take.

export interface RunStats {
  coins: number;
  coinTotal: number;
  principles: number;
  principleTotal: number;
  /** How many of the five breaks were actually caught. */
  waves: number;
}

/** Card size. 16:9 is what X, LinkedIn and iMessage all preview without cropping. */
export const CARD_W = 1200;
export const CARD_H = 675;

/**
 * Source rectangle that fills a destination box without distorting, cropping
 * the overflowing axis evenly. The captured frame is whatever shape the
 * visitor's window happens to be, and a portrait phone capture stretched to
 * 16:9 turns the surfer into a smear.
 */
export function coverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): { x: number; y: number; w: number; h: number } {
  if (srcW <= 0 || srcH <= 0) return { x: 0, y: 0, w: 0, h: 0 };
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const w = dstW / scale;
  const h = dstH / scale;
  return { x: (srcW - w) / 2, y: (srcH - h) / 2, w, h };
}

/**
 * The line of numbers across the card. Only what actually happened: a run with
 * no waves caught should not advertise a zero, because the card is a brag and a
 * zero is not one.
 */
export function statLine(stats: RunStats): string {
  const parts: string[] = [];
  if (stats.coins > 0) parts.push(`${stats.coins} / ${stats.coinTotal} coins`);
  if (stats.waves > 0) parts.push(`${stats.waves} ${stats.waves === 1 ? "wave" : "waves"} caught`);
  if (stats.principles > 0) parts.push(`${stats.principles} / ${stats.principleTotal} principles`);
  // Someone who just wanted to look at the ocean still deserves a card worth
  // sending. Leading a share image with "0 / 42 coins" advertises a score
  // nobody set out to beat, and reads as a failure rather than as a place.
  if (parts.length === 0) return "Out on the water";
  return parts.join("   ·   ");
}

/**
 * Message body offered alongside the image. No dashes, per house style.
 *
 * Two sentences, not one with a value substituted into it: "came back with Out
 * on the water" is what happens when a headline that is a phrase gets used
 * where a headline that is a quantity was assumed.
 */
export function shareText(stats: RunStats): string {
  const scored = stats.coins > 0 || stats.waves > 0 || stats.principles > 0;
  return scored
    ? `I went surfing in Utku Acikgoz's portfolio and came back with ${statLine(stats)}.`
    : "I went surfing in Utku Acikgoz's portfolio. There is an ocean in there.";
}

export const SHARE_TITLE = "Surf run, utkuacikgoz.com";

/** Stable enough to sort in a downloads folder, unique enough not to collide. */
export function shareFileName(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return `surf-run-${stamp}.png`;
}

/**
 * The link the card points at. It carries `?surf=1` so a recipient lands in the
 * ocean rather than on the hero, which only works because the router keeps a
 * query string across navigation now.
 */
export function shareUrl(origin: string): string {
  return `${origin.replace(/\/+$/, "")}/?surf=1`;
}

/**
 * Which sharing route this browser can take.
 *
 * `share` alone is not enough: Web Share exists on plenty of desktop browsers
 * that refuse file payloads, so the file has to be offered to `canShare`
 * before it is trusted. Anything that fails that gets the download, which
 * works everywhere and is what a desktop visitor wanted anyway.
 */
export function shareRoute(nav: Navigator | undefined, file: File | null): "web-share" | "download" {
  if (!nav || !file) return "download";
  const canShare = (nav as Navigator & { canShare?: (d: ShareData) => boolean }).canShare;
  if (typeof nav.share !== "function" || typeof canShare !== "function") return "download";
  try {
    return canShare({ files: [file] }) ? "web-share" : "download";
  } catch {
    return "download";
  }
}
