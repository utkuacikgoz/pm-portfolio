import { useEffect, useRef } from "react";

// Module-level constants so their identity is stable across renders (the hook
// depends on the array reference).
export const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

export const HIRE = ["h", "i", "r", "e"] as const;

const norm = (k: string) => (k.length === 1 ? k.toLowerCase() : k);

/**
 * Fires `onMatch` when `sequence` is typed in order (case-insensitive for
 * letters). The buffer resets on a wrong key, and a wrong key that happens to be
 * the sequence's first key restarts the match at position 1. Ignores typing
 * inside inputs/textareas. Pass a stable `sequence` reference.
 */
export function useKeySequence(sequence: readonly string[], onMatch: () => void) {
  const idx = useRef(0);
  const cb = useRef(onMatch);
  cb.current = onMatch;

  useEffect(() => {
    const target = sequence.map(norm);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const k = norm(e.key);
      if (k === target[idx.current]) {
        idx.current += 1;
        if (idx.current === target.length) {
          idx.current = 0;
          cb.current();
        }
      } else {
        idx.current = k === target[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sequence]);
}
