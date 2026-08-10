#!/usr/bin/env node
// Render the Open Graph card from scripts/og-image.svg to public/og-image.jpg.
//
//   npm run gen:og
//
// Why a script rather than a checked-in export nobody can reproduce: the card
// carries the domain and the five project accents, both of which drift. The
// previous card still advertised the old subdomain and used the pre-taupe
// palette, with Apollo and Upshift's colours swapped relative to the registry.
//
// JPEG, not PNG: the card is a full-bleed gradient photograph-like image, where
// PNG was costing 2.2 MB. At q80 it is ~200 KB and visually identical. Since the
// site is noindex, a pasted link IS the distribution channel, so the unfurl
// needs to be fast.
//
// Rendering uses headless Chrome, which is already on most dev machines and
// avoids adding a heavyweight SVG rasteriser to devDependencies.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SVG = path.join(ROOT, "scripts", "og-image.svg");
const OUT = path.join(ROOT, "public", "og-image.jpg");

// The card occupies a 2400x1260 band inside a 2400x2400 canvas.
const WIDTH = 2400;
const HEIGHT = 1260;
const BAND_Y = 570;

const CHROME = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => {
  try {
    execFileSync("test", ["-x", candidate]);
    return true;
  } catch {
    return false;
  }
});

if (!CHROME) {
  console.error("No Chrome/Chromium found. Install one, or render scripts/og-image.svg by hand at 2400x1260.");
  process.exit(1);
}

const work = mkdtempSync(path.join(tmpdir(), "og-"));
try {
  // Reframe the canvas onto just the card band, so the screenshot needs no crop.
  const svg = readFileSync(SVG, "utf8").replace(
    /<svg[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 ${BAND_Y} ${WIDTH} ${HEIGHT}">`
  );
  const framed = path.join(work, "card.svg");
  writeFileSync(framed, svg);

  const shot = path.join(work, "card.png");
  execFileSync(CHROME, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--default-background-color=00000000",
    `--screenshot=${shot}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    `file://${framed}`,
  ]);

  // sips ships with macOS; on Linux swap for cjpeg/convert.
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "80", shot, "--out", OUT]);
  const kb = Math.round(readFileSync(OUT).length / 1024);
  console.log(`wrote public/og-image.jpg  ${WIDTH}x${HEIGHT}  ${kb} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
