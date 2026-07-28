// Generates the character-select portraits once, offline, and writes them as
// static SVGs into src/ui/avatars/. DiceBear stays a devDependency — nothing
// from it ships in the runtime bundle (the app imports the committed SVGs).
// Re-run with: node scripts/gen-avatars.mjs
import { createAvatar } from "@dicebear/core";
import * as pixelArt from "@dicebear/pixel-art";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "ui", "avatars");
mkdirSync(outDir, { recursive: true });

// One seed per class. Change a seed to reroll that character's face.
const specs = [
  { id: "hr", seed: "culture-keeper-hazel" },
  { id: "manager", seed: "decision-maker-quinn" },
  { id: "stalker", seed: "deep-diver-mars" },
];

for (const { id, seed } of specs) {
  const svg = createAvatar(pixelArt, { seed, size: 96 }).toString();
  writeFileSync(join(outDir, `${id}.svg`), svg);
  console.log("wrote", `${id}.svg`);
}
