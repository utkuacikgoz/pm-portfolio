import { describe, expect, it } from "vitest";
import {
  CARD_H,
  CARD_W,
  coverRect,
  shareFileName,
  shareRoute,
  shareText,
  shareUrl,
  statLine,
  type RunStats,
} from "./share-card";

const run = (over: Partial<RunStats> = {}): RunStats => ({
  coins: 21,
  coinTotal: 42,
  principles: 2,
  principleTotal: 4,
  waves: 3,
  ...over,
});

describe("coverRect", () => {
  it("takes the whole frame when the shapes already match", () => {
    const r = coverRect(1600, 900, CARD_W, CARD_H);
    expect(r.x).toBeCloseTo(0, 6);
    expect(r.y).toBeCloseTo(0, 6);
    expect(r.w).toBeCloseTo(1600, 6);
    expect(r.h).toBeCloseTo(900, 6);
  });

  // A portrait phone capture stretched to 16:9 turns the surfer into a smear,
  // so the overflowing axis is cropped rather than squashed.
  it("crops a portrait capture down the middle instead of distorting it", () => {
    const r = coverRect(390, 844, CARD_W, CARD_H);
    expect(r.w).toBeCloseTo(390, 6); // full width kept
    expect(r.h).toBeLessThan(844); // height cropped
    expect(r.w / r.h).toBeCloseTo(CARD_W / CARD_H, 6);
    expect(r.y).toBeCloseTo((844 - r.h) / 2, 6); // centred, not top-anchored
  });

  it("crops the sides of an ultrawide capture", () => {
    const r = coverRect(3440, 1440, CARD_W, CARD_H);
    expect(r.h).toBeCloseTo(1440, 6);
    expect(r.w).toBeLessThan(3440);
    expect(r.x).toBeGreaterThan(0);
  });

  it("returns an empty rect rather than a NaN one for a dead source", () => {
    expect(coverRect(0, 0, CARD_W, CARD_H)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});

describe("stat line", () => {
  it("reads as a brag, in order", () => {
    expect(statLine(run())).toBe("21 / 42 coins   ·   3 waves caught   ·   2 / 4 principles");
  });

  // A zero is not a brag. A run that caught nothing should not say so on a card
  // whose whole job is to be worth sending someone.
  it("omits what did not happen", () => {
    expect(statLine(run({ waves: 0, principles: 0 }))).toBe("21 / 42 coins");
  });

  // The card's whole job is to be worth sending. A share image whose headline
  // is "0 / 42 coins" advertises a score nobody set out to beat.
  it("never leads with a zero", () => {
    expect(statLine(run({ coins: 0, waves: 0, principles: 0 }))).toBe("Out on the water");
    expect(statLine(run({ coins: 0, waves: 0, principles: 0 }))).not.toContain("0");
  });

  it("still reports a run that only caught waves", () => {
    expect(statLine(run({ coins: 0, principles: 0, waves: 2 }))).toBe("2 waves caught");
  });

  it("counts one wave in the singular", () => {
    expect(statLine(run({ waves: 1 }))).toContain("1 wave caught");
    expect(statLine(run({ waves: 2 }))).toContain("2 waves caught");
  });
});

describe("share copy", () => {
  it("names whose portfolio it was", () => {
    expect(shareText(run())).toContain("Utku Acikgoz");
    expect(shareText(run())).toContain("21 / 42 coins");
  });

  // Substituting a phrase headline into a sentence built for a quantity gives
  // "came back with Out on the water".
  it("stays grammatical when there is nothing to report", () => {
    const text = shareText(run({ coins: 0, waves: 0, principles: 0 }));
    expect(text).not.toContain("came back with");
    expect(text).toContain("Utku Acikgoz");
    expect(text).toMatch(/\.$/);
  });

  // House style: no em dash, en dash or minus sign in anything a visitor reads.
  it("carries no dashes", () => {
    for (const s of [shareText(run()), statLine(run()), shareUrl("https://utkuacikgoz.com")]) {
      expect(s).not.toMatch(/[‐-―−]/);
    }
  });

  it("points the recipient at the ocean, not the hero", () => {
    expect(shareUrl("https://utkuacikgoz.com")).toBe("https://utkuacikgoz.com/?surf=1");
    expect(shareUrl("https://utkuacikgoz.com/")).toBe("https://utkuacikgoz.com/?surf=1");
  });

  it("names the file so a downloads folder stays sortable", () => {
    const name = shareFileName(new Date("2026-08-29T18:07:15Z"));
    expect(name).toBe("surf-run-2026-08-29-18-07.png");
  });
});

describe("share route", () => {
  const file = { name: "x.png", type: "image/png" } as File;

  it("uses Web Share only when the browser accepts the file itself", () => {
    const nav = { share: () => {}, canShare: () => true } as unknown as Navigator;
    expect(shareRoute(nav, file)).toBe("web-share");
  });

  // Plenty of desktop browsers expose `share` and then refuse file payloads, so
  // the file has to clear `canShare` before it is trusted.
  it("falls back to download when files are refused", () => {
    const nav = { share: () => {}, canShare: () => false } as unknown as Navigator;
    expect(shareRoute(nav, file)).toBe("download");
  });

  it("falls back when there is no Web Share at all", () => {
    expect(shareRoute({} as Navigator, file)).toBe("download");
    expect(shareRoute(undefined, file)).toBe("download");
  });

  it("falls back when canShare throws rather than answering", () => {
    const nav = {
      share: () => {},
      canShare: () => {
        throw new Error("nope");
      },
    } as unknown as Navigator;
    expect(shareRoute(nav, file)).toBe("download");
  });

  it("falls back when the card could not be rendered", () => {
    const nav = { share: () => {}, canShare: () => true } as unknown as Navigator;
    expect(shareRoute(nav, null)).toBe("download");
  });
});
