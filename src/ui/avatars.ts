// Character-select data + persistence, kept separate from the component so the
// component file only exports a component (react-refresh friendly).
const AVATAR_KEY = "pmworld.avatar";

export interface Stat {
  label: string;
  value: number; // 0..10
}

export interface Avatar {
  id: string;
  emoji: string;
  label: string; // class name (also the in-world badge)
  title: string; // epithet
  pun: string; // flavor line
  move: string; // signature move
  accent: string;
  stats: Stat[];
}

export const AVATARS: Avatar[] = [
  {
    id: "hr",
    emoji: "📋",
    label: "HR",
    title: "The Culture Keeper",
    pun: "Here for the culture fit.",
    move: "Vibe Check",
    accent: "#00FF88",
    stats: [
      { label: "Empathy", value: 9 },
      { label: "Process", value: 8 },
      { label: "Patience", value: 7 },
      { label: "Chill", value: 6 },
    ],
  },
  {
    id: "manager",
    emoji: "📈",
    label: "Hiring Manager",
    title: "The Decision Maker",
    pun: "Show me the outcomes.",
    move: "Offer or Hard Pass",
    accent: "#FFD700",
    stats: [
      { label: "Outcomes", value: 10 },
      { label: "Skepticism", value: 8 },
      { label: "Speed", value: 7 },
      { label: "Budget", value: 5 },
    ],
  },
  {
    id: "stalker",
    emoji: "🕵️",
    label: "Stalker",
    title: "The Deep Diver",
    pun: "I already read your LinkedIn.",
    move: "Full Background Check",
    accent: "#FF0080",
    stats: [
      { label: "Recon", value: 10 },
      { label: "Persistence", value: 9 },
      { label: "Snacks", value: 8 },
      { label: "Boundaries", value: 2 },
    ],
  },
];

export function readAvatar(): string | null {
  try {
    return localStorage.getItem(AVATAR_KEY);
  } catch {
    return null;
  }
}

export function writeAvatar(id: string) {
  try {
    localStorage.setItem(AVATAR_KEY, id);
  } catch {
    // private mode — the gate just won't be remembered; harmless.
  }
}

export function avatarById(id: string | null): Avatar | undefined {
  return AVATARS.find((a) => a.id === id);
}
