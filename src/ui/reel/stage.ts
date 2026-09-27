// The reel's stage geometry, split out with no imports so the hero can place
// the DOM button on the stage without pulling the reel itself into the entry
// chunk. drawReel re-exports both.

/** Section 2.1: contain the 1920 x 1080 stage, never upscaled past 1x. */
export function stageTransform(width: number, height: number): { s: number; ox: number; oy: number } {
  const s = Math.min(1, width / 1280, height / 720);
  return { s, ox: width / 2 - 960 * s, oy: height / 2 - 540 * s };
}

/** Where the DOM "ENTER THE UNIVERSE" button sits on the stage (virtual px). */
export const CTA_STAGE = { cx: 960, cy: 787.4, w: 258, h: 55 } as const;
