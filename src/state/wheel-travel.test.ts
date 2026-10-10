import { describe, expect, it } from "vitest";
import { WHEEL_LOCK_MS, initialWheel, wheelStep } from "./wheel-travel";
import type { WheelState } from "./wheel-travel";

function feed(events: [number, number][]) {
  let s: WheelState = initialWheel();
  const steps: number[] = [];
  for (const [delta, at] of events) {
    const r = wheelStep(s, delta, at);
    s = r.state;
    if (r.step) steps.push(r.step);
  }
  return steps;
}

describe("wheel travel", () => {
  it("one mouse notch moves one island, either way", () => {
    expect(feed([[100, 0]])).toEqual([1]);
    expect(feed([[-100, 0]])).toEqual([-1]);
  });

  it("a trackpad burst with a long momentum tail moves exactly one island", () => {
    const events: [number, number][] = [];
    for (let i = 0; i < 120; i++) events.push([Math.max(1, 30 - i * 0.25), i * 16]); // ~2 s of decaying deltas
    expect(feed(events)).toEqual([1]);
  });

  it("a slow machine's sparse momentum still moves only one island", () => {
    const events: [number, number][] = [];
    for (let i = 0; i < 12; i++) events.push([30, i * 500]); // 2 fps, events 500 ms apart
    expect(feed(events)).toEqual([1]);
  });

  it("small jitter never travels", () => {
    expect(feed([[3, 0], [-2, 16], [4, 32], [-3, 48]])).toEqual([]);
  });

  it("a second deliberate gesture after a pause moves again", () => {
    expect(feed([[100, 0], [100, WHEEL_LOCK_MS + 100]])).toEqual([1, 1]);
  });
});
