import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { BrowserRouter } from "./router";
import SurfJourneyStatus from "./ui/SurfJourneyStatus";

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
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
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
    expect(container.textContent).toContain("35% faster AML review");
    expect(container.textContent).toContain("CURRENTLY BUILDING");
    expect(elementByText<HTMLAnchorElement>("a", "Book a 20 min call").href).toBeTruthy();
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

    act(() => elementByText<HTMLAnchorElement>("a", "EXPLORE THE WORLD").click());
    expect(window.location.pathname).toBe("/");
    expect(elementByText("h1", "Utku Acikgoz")).toBeInTheDocument();
  });

  it("makes the surf run goal and progress legible", () => {
    act(() => root.render(<SurfJourneyStatus coins={21} visited={2} />));

    expect(container.textContent).toContain("21 / 42");
    expect(container.textContent).toContain("50%");
    expect(container.textContent).toContain("2 / 4 product principles found");
    expect(container.querySelector<HTMLElement>('[data-testid="surf-progress-bar"]')?.style.width).toBe("50%");
  });
});
