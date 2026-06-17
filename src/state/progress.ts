import { useSyncExternalStore } from "react";

// Single localStorage source of truth for the lightweight, opt-in gamification:
// which case studies you've read to the end, and whether you found the easter egg.
// Never gates content — it only decorates (✓ stamps) and rewards (egg toast).

const KEY = "pmworld.progress.v1";
const EVENT = "pmworld:progress";

export interface Progress {
  read: Set<string>;
  egg: boolean;
}

interface Stored {
  read: string[];
  egg: boolean;
}

function readStored(): Stored {
  if (typeof localStorage === "undefined") return { read: [], egg: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { read: [], egg: false };
    const p = JSON.parse(raw) as Partial<Stored>;
    return { read: Array.isArray(p.read) ? p.read : [], egg: !!p.egg };
  } catch {
    return { read: [], egg: false };
  }
}

function writeStored(next: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — gamification is non-essential, fail silently.
  }
  // Notify same-tab subscribers (the native `storage` event only fires cross-tab).
  window.dispatchEvent(new Event(EVENT));
}

export function markRead(id: string) {
  const cur = readStored();
  if (cur.read.includes(id)) return;
  writeStored({ ...cur, read: [...cur.read, id] });
}

export function markEgg() {
  const cur = readStored();
  if (cur.egg) return;
  writeStored({ ...cur, egg: true });
}

// ── useSyncExternalStore wiring ──────────────────────────────────────────────
// Cache the snapshot so getSnapshot returns a stable reference between writes
// (React bails out of re-render only if the reference is identical).
let cache: Progress | null = null;
let cacheKey = "";

function getSnapshot(): Progress {
  const s = readStored();
  const key = `${s.read.join(",")}|${s.egg}`;
  if (!cache || key !== cacheKey) {
    cache = { read: new Set(s.read), egg: s.egg };
    cacheKey = key;
  }
  return cache;
}

const SERVER_SNAPSHOT: Progress = { read: new Set(), egg: false };

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
