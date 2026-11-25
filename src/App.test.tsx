import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { BrowserRouter } from "./router";
import SurfJourneyStatus from "./ui/SurfJourneyStatus";
import { AVAILABILITY, CLAIM, SHELF_TITLE } from "./content/positioning";

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly scrollMargin = "0px";
  readonly thresholds = [0];
  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

let container: HTMLDivElement;
let root: Root;

function renderApp(path = "/") {
  window.history.replaceState(null, "", path);
  act(() => {
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  });
}

// Resume, ProjectPanel and AvatarSelect are lazy (they are off the critical
// path), so their Suspense boundaries resolve a microtask after the click that
// triggers them. Awaiting an empty async act flushes the import.
async function flushLazy() {
  await act(async () => {
    // Awaiting the same dynamic imports the components use is deterministic;
    // an empty async act only flushes one microtask tick and can land early.
    await import("./pages/Resume");
    await import("./ui/ProjectPanel");
    await import("./ui/AvatarSelect");
  });
}

function elementByText<E extends Element>(selector: string, text: string): E {
  const element = [...container.querySelectorAll<E>(selector)].find((node) => node.textContent?.includes(text));
  if (!element) throw new Error(`No ${selector} contains ${JSON.stringify(text)}`);
  return element;
}

describe("portfolio journey", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    sessionStorage.clear();
    localStorage.clear();
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(performance.now());
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("gives flat-mode visitors the proof, work, indie products, and contact funnel", () => {
    renderApp();

    expect(elementByText("h1", "Utku Acikgoz")).toBeInTheDocument();
    // Phones skip the hero, so this list is the landing page most recruiters
    // see. It kept the old credential line for a month after the claim shipped.
    expect(container.textContent).toContain(CLAIM);
    expect(container.textContent).not.toContain("8+ years and 11+ products shipped. I lead");
    expect(container.textContent).toContain("35% less AML review time");
    expect(container.textContent).toContain(SHELF_TITLE);
    expect(container.textContent).toContain(AVAILABILITY);
    expect(container.textContent).not.toMatch(/buyback/i);
    // The flat map is a phone landing: screen readers must hear the project
    // list once, from the cards, not again from the world's hidden nav.
    expect(container.querySelector('nav[aria-label="Career world, projects"]')).not.toBeInTheDocument();
    expect(elementByText<HTMLAnchorElement>("a", "Book a 30 min call").href).toBe("https://cal.com/utku-acikgoz/30min?overlayCalendar=true");
    for (const [title, href] of [
      ["PassATS", "https://www.passats.pro/"],
      ["Psst", "https://www.psstapp.fun/"],
      ["Rack Rate", "https://rack-rate-flax.vercel.app/"],
      ["Little Menace", "https://www.littlemenace.fun/"],
    ]) {
      const live = elementByText<HTMLAnchorElement>("a", title);
      expect(live.href).toBe(href);
      expect(live.textContent).toContain("LIVE");
      expect(live.textContent).not.toContain("IN DEVELOPMENT");
    }
    expect(elementByText<HTMLAnchorElement>("a", "Download CV").getAttribute("href")).toBe("/UtkuAcikgoz-CV.pdf");
  });

  it("opens and closes a case study while keeping the URL as source of truth", async () => {
    renderApp();

    act(() => elementByText<HTMLButtonElement>("button", "BiLira").click());
    await flushLazy();
    expect(window.location.pathname).toBe("/p/bilira");
    expect(container.querySelector('[role="dialog"][aria-label="BiLira case study"]')).toBeInTheDocument();
    expect(document.title).toContain("BiLira");

    act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Close case study"]')?.click());
    expect(window.location.pathname).toBe("/");
    expect(container.querySelector('[aria-label="BiLira case study"]')).not.toBeInTheDocument();
  });

  it("deep links directly to a case study and recovers invalid routes", async () => {
    renderApp("/p/apollo");
    await flushLazy();
    expect(container.querySelector('[role="dialog"][aria-label="Apollo case study"]')).toBeInTheDocument();

    act(() => root.unmount());
    root = createRoot(container);
    renderApp("/p/not-a-project");
    expect(window.location.pathname).toBe("/");
    expect(elementByText("h1", "Utku Acikgoz")).toBeInTheDocument();
  });

  it("offers a fast resume route and supports client-side navigation", async () => {
    renderApp("/resume");
    await flushLazy();
    expect(elementByText("h2", "SELECTED WORK")).toBeInTheDocument();
    expect(container.textContent).toContain(CLAIM);
    expect(container.textContent).toContain(AVAILABILITY);

    act(() => elementByText<HTMLAnchorElement>("a", "EXPLORE THE WORLD").click());
    expect(window.location.pathname).toBe("/");
    expect(elementByText("h1", "Utku Acikgoz")).toBeInTheDocument();
  });

  it("makes the surf run goal and progress legible", () => {
    const onToggleHelp = vi.fn();
    const onToggleProjects = vi.fn();
    act(() =>
      root.render(
        <SurfJourneyStatus
          coins={21}
          coinTotal={42}
          projectsFound={2}
          projectTotal={5}
          onToggleHelp={onToggleHelp}
          onToggleProjects={onToggleProjects}
        />
      )
    );

    expect(container.textContent).toContain("PROJECTS 2 / 5");
    expect(container.textContent).toContain("21 / 42");
    expect(container.textContent).toContain("40%");
    expect(container.querySelector<HTMLElement>('[data-testid="surf-progress-bar"]')?.style.width).toBe("40%");

    act(() => elementByText<HTMLButtonElement>("button", "CONTROLS").click());
    act(() => elementByText<HTMLButtonElement>("button", "FOUND 2").click());
    expect(onToggleHelp).toHaveBeenCalledOnce();
    expect(onToggleProjects).toHaveBeenCalledOnce();
  });

  // Totals arrive from the world once a run starts, so the HUD renders for one
  // frame before they do. Dividing by that zero put "NaN%" on screen.
  it("survives the frame before the world has reported its totals", () => {
    act(() =>
      root.render(
        <SurfJourneyStatus
          coins={0}
          coinTotal={0}
          projectsFound={0}
          projectTotal={5}
          onToggleHelp={vi.fn()}
          onToggleProjects={vi.fn()}
        />
      )
    );

    expect(container.textContent).toContain("PROJECTS 0 / 5");
    expect(container.textContent).toContain("0%");
    expect(container.textContent).not.toContain("NaN");
    expect(container.querySelector<HTMLElement>('[data-testid="surf-progress-bar"]')?.style.width).toBe("0%");
  });
});
