import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "../router";

// The rest of the suite runs in flat mode (jsdom has no WebGL), where FlatMap
// carries the <h1>. That left the world path, which is what most visitors
// actually get, completely unexercised: the hero owns the only heading, and
// once you enter it unmounts, so the primary route had no <h1> at all and the
// case-study panel's <h2> hung off nothing.
vi.mock("../state/useExperienceMode", () => ({ useExperienceMode: () => "world" }));
vi.mock("../world/World", () => ({ default: () => null }));

let container: HTMLDivElement;
let root: Root;

function headings() {
  return [...container.querySelectorAll("h1")].map((h) => h.textContent ?? "");
}

async function renderWorld(path = "/") {
  window.history.replaceState(null, "", path);
  const { default: WorldExperience } = await import("./WorldExperience");
  await act(async () => {
    root.render(
      <BrowserRouter>
        <WorldExperience />
      </BrowserRouter>
    );
  });
}

describe("world route headings", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    sessionStorage.clear();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("gives the landing hero exactly one h1", async () => {
    await renderWorld();
    expect(headings()).toHaveLength(1);
    expect(headings()[0]).toContain("Product Manager");
  });

  it("reads as the plain title, with no duplicated words from the heat glow", async () => {
    // The hero's per-word glow is a `::after` pseudo-element fed by `data-word`
    // precisely so its text stays out of the DOM. An earlier version rendered it
    // as a twin <span>, which made the heading read
    // "SeniorSenior TechnicalTechnical ProductProduct ManagerManager" to a
    // crawler while still passing a `toContain` assertion.
    await renderWorld();
    expect(headings()[0]?.replace(/\s+/g, " ").trim()).toBe("Senior Technical Product Manager");
  });

  it("keeps exactly one h1 once the hero is gone", async () => {
    await renderWorld();
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((b) => b.textContent?.includes("ENTER"))
        ?.click();
    });

    const after = headings();
    expect(after).toHaveLength(1);
    expect(after[0]).toContain("Utku Acikgoz");
  });

  it("declares the page on a deep-linked case study, where the hero never shows", async () => {
    await renderWorld("/p/bilira");
    // Flush the lazy drawer explicitly. Leaving it to chance meant this case
    // sometimes ran without the panel mounted, so it passed locally and failed
    // in CI on the run where the chunk resolved in time.
    await act(async () => {
      await import("../ui/ProjectPanel");
    });
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(headings()).toHaveLength(1);
  });

  it("wraps the route in a main landmark", async () => {
    await renderWorld();
    expect(container.querySelectorAll("main")).toHaveLength(1);
  });
});
