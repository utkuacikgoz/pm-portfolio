import { beforeEach, describe, expect, it } from "vitest";
import { markEgg, markEggId, markRead } from "./progress";

const KEY = "pmworld.progress.v1";
const load = () => JSON.parse(localStorage.getItem(KEY) || "{}");

beforeEach(() => localStorage.clear());

describe("progress egg tracking", () => {
  it("markEgg records the surfboard as id 'surf' and sets the legacy flag", () => {
    markEgg();
    const s = load();
    expect(s.egg).toBe(true);
    expect(s.eggs).toContain("surf");
  });

  it("markEggId adds distinct eggs and dedups repeats", () => {
    markEggId("konami");
    markEggId("konami");
    markEggId("hire");
    expect(load().eggs).toEqual(["konami", "hire"]);
    expect(load().egg).toBe(false); // no surfboard yet
  });

  it("migrates legacy {egg:true} with no eggs array to include 'surf'", () => {
    localStorage.setItem(KEY, JSON.stringify({ read: [], egg: true }));
    markEggId("konami"); // read → migrate → write
    const s = load();
    expect(s.eggs).toContain("surf");
    expect(s.eggs).toContain("konami");
  });

  it("markRead dedups project ids", () => {
    markRead("bilira");
    markRead("bilira");
    expect(load().read).toEqual(["bilira"]);
  });
});
