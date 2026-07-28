// Generates the character-select portraits once, offline, and writes them as
// static SVGs into src/ui/avatars/. DiceBear stays a devDependency — nothing
// from it ships in the runtime bundle (the app imports the committed SVGs).
// Re-run with: node scripts/gen-avatars.mjs  (or npm run gen:avatars)
import { createAvatar } from "@dicebear/core";
import * as pixelArt from "@dicebear/pixel-art";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "ui", "avatars");
mkdirSync(outDir, { recursive: true });

// Each class is dressed to read as its role (single-element arrays force a value).
// Reroll a face by changing its seed; retune by editing its options.
const specs = [
  {
    id: "hr",
    seed: "culture-keeper",
    opts: {
      mouth: ["happy07"],
      glasses: ["light03"],
      glassesProbability: 100,
      hatProbability: 0,
      beardProbability: 0,
      hair: ["short16"],
      clothingColor: ["2f9e6f"], // warm green, matches the HR accent
    },
  },
  {
    id: "manager",
    seed: "decision-maker",
    opts: {
      mouth: ["happy01"],
      glasses: ["dark05"],
      glassesProbability: 100,
      hatProbability: 0,
      beardProbability: 0,
      hair: ["short07"],
      clothing: ["variant01"],
      clothingColor: ["c9a227"], // gold, sharp/formal read
    },
  },
  {
    id: "stalker",
    seed: "deep-diver",
    opts: {
      mouth: ["sad03"],
      hat: ["variant05"],
      hatProbability: 100,
      hatColor: ["1c1c26"],
      glasses: ["dark01"], // shades
      glassesProbability: 100,
      beard: ["variant03"],
      beardProbability: 100,
      hair: ["short01"],
      hairColor: ["221b16"],
      clothingColor: ["3a1030"], // dark magenta coat
    },
  },
];

for (const { id, seed, opts } of specs) {
  const svg = createAvatar(pixelArt, { seed, size: 128, ...opts }).toString();
  writeFileSync(join(outDir, `${id}.svg`), svg);
  console.log("wrote", `${id}.svg`);
}
