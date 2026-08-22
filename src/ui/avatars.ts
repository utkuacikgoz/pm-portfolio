// Character-select data + persistence, kept separate from the component so the
// component file only exports a component (react-refresh friendly).
import hrPortrait from "./avatars/hr.svg";
import managerPortrait from "./avatars/manager.svg";
import stalkerPortrait from "./avatars/stalker.svg";
import { T } from "../theme";

interface Stat {
  label: string;
  value: number; // 0..10
}

interface Avatar {
  id: string;
  portrait: string; // pixel-art SVG (generated offline by scripts/gen-avatars.mjs)
  label: string; // class name
  title: string; // epithet
  pun: string; // flavor line
  accent: string;
  stats: Stat[];
}

export const AVATARS: Avatar[] = [
  {
    id: "hr",
    portrait: hrPortrait,
    label: "HR",
    title: "The Culture Keeper",
    pun: "Here for the culture fit.",
    accent: T.seafoam,
    stats: [
      { label: "Empathy", value: 9 },
      { label: "Process", value: 8 },
      { label: "Patience", value: 7 },
      { label: "Chill", value: 6 },
    ],
  },
  {
    id: "manager",
    portrait: managerPortrait,
    label: "Hiring Manager",
    title: "The Decision Maker",
    pun: "Show me the outcomes.",
    accent: T.gold,
    stats: [
      { label: "Outcomes", value: 10 },
      { label: "Skepticism", value: 8 },
      { label: "Speed", value: 7 },
      { label: "Budget", value: 5 },
    ],
  },
  {
    id: "stalker",
    portrait: stalkerPortrait,
    label: "Stalker",
    title: "The Deep Diver",
    pun: "I already read your LinkedIn.",
    accent: T.blue,
    stats: [
      { label: "Recon", value: 10 },
      { label: "Persistence", value: 9 },
      { label: "Snacks", value: 8 },
      { label: "Boundaries", value: 2 },
    ],
  },
];

// Persistence lives in its own leaf module so reading the stored pick does not
// pull this table (and three portrait SVGs) into the entry chunk.
export { readAvatar, writeAvatar } from "./avatar-store";
