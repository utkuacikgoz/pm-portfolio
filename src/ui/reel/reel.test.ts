import { beforeAll, describe, expect, it, vi } from "vitest";
import { PUBLISHED_PROJECTS } from "../../projects/projects";

// jsdom has no 2D canvas, so the background bitmap is stubbed out; everything
// else the reel does is recorded as a call log off a fake context.
vi.mock("./cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./cache")>()),
  getBackground: () => ({ bitmap: true }),
}));

const { drawReel, REEL_DURATION, REEL_REST, SKIP_TARGET } = await import("./drawReel");
const { FIGURES, PRODUCTS, REEL_PRODUCT_IDS } = await import("./cache");

beforeAll(() => {
  if (typeof globalThis.Path2D === "undefined") {
    class FakePath {
      moveTo() {}
      lineTo() {}
      arc() {}
      rect() {}
      closePath() {}
    }
    vi.stubGlobal("Path2D", FakePath);
  }
});

const round = (v: unknown) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : typeof v === "string" ? v : typeof v);

/** A context that measures text deterministically and logs every call and style set. */
function recorder(width: number, height: number) {
  const log: string[] = [];
  const state: Record<string, unknown> = { font: "10px sans-serif", fillStyle: "#000000" };
  const size = () => Number(/(\d+(?:\.\d+)?)px/.exec(String(state.font))?.[1] ?? 10);
  const target = {
    canvas: { width, height },
    measureText: (s: string) => ({ width: Array.from(s).length * 0.6 * size(), actualBoundingBoxAscent: 0.72 * size() }),
  };
  const ctx = new Proxy(target, {
    get(t, key: string) {
      if (key in t) return (t as Record<string, unknown>)[key];
      if (key in state) return state[key];
      return (...args: unknown[]) => {
        if (key === "save" || key === "restore") log.push(key);
        else log.push(`${key}(${args.map(round).join(",")})`);
      };
    },
    set(_, key: string, value) {
      state[key] = value;
      log.push(`${key}=${round(value)}`);
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log };
}

function frame(t: number, w = 1920, h = 1080) {
  const { ctx, log } = recorder(w, h);
  drawReel(ctx, t, w, h);
  return log.join("\n");
}

describe("entry reel", () => {
  it("choreographs exactly the five published employment projects, in order", () => {
    // The charts are bespoke per product. Publishing a sixth project should fail
    // here and force a deliberate choreography update, not quietly reflow the reel.
    expect(PUBLISHED_PROJECTS.map((p) => p.id)).toEqual([...REEL_PRODUCT_IDS]);
    expect(PRODUCTS.map((p) => p.id)).toEqual([...REEL_PRODUCT_IDS]);
  });

  it("only shows figures its registry tagline states", () => {
    const places = { mestores: 1 } as Record<string, number>;
    for (const p of PRODUCTS) {
      const f = FIGURES[p.id];
      expect(p.phrase + p.category, p.id).toContain(f.str + (f.small ?? ""));
      if (f.from !== 0 && p.id !== "la3eb") {
        const scale = 10 ** (places[p.id] ?? 0);
        const fmt = (v: number) => (v / scale).toFixed(places[p.id] ?? 0);
        expect(p.phrase, p.id).toContain(`${fmt(f.from)}% to ${fmt(f.to)}%`);
      }
    }
  });

  it("is a pure function of time: the same t paints the same frame", () => {
    const times = [0, 3.3, 7.77, SKIP_TARGET, REEL_DURATION];
    frame(1); // the first call measures glyphs once; that is a memo, not output
    const first = times.map((t) => frame(t));
    const again = [...times].reverse().map((t) => frame(t)).reverse();
    expect(again).toEqual(first);
  });

  it("holds still from the resting frame on", () => {
    const rest = frame(REEL_REST);
    expect(frame(REEL_DURATION)).toBe(rest);
    expect(frame(20)).toBe(rest);
  });

  it("never draws with the banned expensive state", () => {
    const all = [0.5, 2, 4.3, 6.1, 9.9, 12.4, 13.1, 13.9].map((t) => frame(t)).join("\n");
    expect(all).not.toMatch(/^(filter|shadowBlur|shadowColor|letterSpacing)=/m);
    expect(all).not.toMatch(/^(getImageData|putImageData)\(/m);
  });
});
