import { useSyncExternalStore } from "react";

// Single localStorage source of truth for the lightweight, opt-in gamification:
// which case studies you've read to the end, and whether you found the easter egg.
// Never gates content — it only decorates (✓ stamps) and rewards (egg toast).

const KEY = "pmworld.progress.v1";
const EVENT = "pmworld:progress";

export interface Progress {
  read: Set<string>;
  egg: boolean; // legacy: the surfboard egg (kept for back-compat)
  eggs: Set<string>; // all found egg ids (includes "surf")
}

interface Stored {
  read: string[];
  egg: boolean;
  eggs: string[];
}

function readStored(): Stored {
  const empty: Stored = { read: [], egg: false, eggs: [] };
  if (typeof localStorage === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Stored>;
    const egg = !!p.egg;
    // Migrate legacy data: an old `egg:true` with no `eggs` array = surfboard.
    const eggs = Array.isArray(p.eggs) ? p.eggs : egg ? ["surf"] : [];
    return { read: Array.isArray(p.read) ? p.read : [], egg, eggs };
  } catch {
    return empty;
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

// Record a found egg by id. `markEgg()` remains the surfboard for back-compat.
export function markEggId(id: string) {
  const cur = readStored();
  if (cur.eggs.includes(id)) return;
  writeStored({ ...cur, egg: cur.egg || id === "surf", eggs: [...cur.eggs, id] });
}

export function markEgg() {
  markEggId("surf");
}

// ── useSyncExternalStore wiring ──────────────────────────────────────────────
// Cache the snapshot so getSnapshot returns a stable reference between writes
// (React bails out of re-render only if the reference is identical).
let cache: Progress | null = null;
let cacheKey = "";

function getSnapshot(): Progress {
  const s = readStored();
  const key = `${s.read.join(",")}|${s.egg}|${s.eggs.join(",")}`;
  if (!cache || key !== cacheKey) {
    cache = { read: new Set(s.read), egg: s.egg, eggs: new Set(s.eggs) };
    cacheKey = key;
  }
  return cache;
}

const SERVER_SNAPSHOT: Progress = { read: new Set(), egg: false, eggs: new Set() };

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
