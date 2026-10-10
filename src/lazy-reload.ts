import { lazy } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

/**
 * Survive a deploy. Every build renames its chunks, so a tab opened before a
 * deploy asks for files the new deployment no longer serves the first time it
 * lazy loads anything (opening the resume, a case study, the world). The import
 * rejects and the app-level boundary shows "Something broke". The fix is the
 * one Vite documents: reload once, which fetches the new index and its chunks.
 * Guarded by a timestamp so a chunk that is genuinely missing cannot loop.
 */
const KEY = "chunkReloadAt";
const MIN_GAP_MS = 10_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError/i.test(message);
}

/** Reloads the page unless it already did so in the last few seconds. Returns whether it reloaded. */
export function reloadOnce(now = Date.now(), storage: Pick<Storage, "getItem" | "setItem"> = sessionStorage, reload = () => window.location.reload()): boolean {
  try {
    const last = Number(storage.getItem(KEY) ?? 0);
    if (now - last < MIN_GAP_MS) return false;
    storage.setItem(KEY, String(now));
  } catch {
    return false; // storage blocked: do not risk a loop
  }
  reload();
  return true;
}

/** `React.lazy`, but a chunk that vanished in a deploy reloads the page instead of crashing it. */
// React.lazy itself is typed against ComponentType<any>; matching it keeps prop types flowing through.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadOnce()) return new Promise<{ default: T }>(() => {});
      throw error;
    }),
  );
}
