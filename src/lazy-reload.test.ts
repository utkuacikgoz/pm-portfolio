import { describe, expect, it, vi } from "vitest";
import { isChunkLoadError, reloadOnce } from "./lazy-reload";

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("lazy chunk reload", () => {
  it("recognises the browsers' chunk load failures and nothing else", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/Resume-abc.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("reloads once, then refuses inside the guard window so it cannot loop", () => {
    const storage = memoryStorage();
    const reload = vi.fn();
    expect(reloadOnce(1_000_000, storage, reload)).toBe(true);
    expect(reloadOnce(1_005_000, storage, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reloadOnce(1_020_000, storage, reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
