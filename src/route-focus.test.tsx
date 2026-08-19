import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { BrowserRouter } from "./router";

// Moving between the world and the resume replaces the whole page. Without this,
// focus stays on a link that no longer exists, falls to <body>, and a screen
// reader announces nothing: the user is silently dropped at the top of a
// document they cannot tell has changed.
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

async function flushLazy() {
  await act(async () => {
    await import("./pages/Resume");
    await import("./ui/ProjectPanel");
  });
}

function linkTo(text: string): HTMLAnchorElement {
  const el = [...container.querySelectorAll("a")].find((a) => a.textContent?.includes(text));
  if (!el) throw new Error(`no link containing ${JSON.stringify(text)}`);
  return el;
}

describe("focus on route change", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    sessionStorage.clear();
    localStorage.clear();
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("scrollTo", vi.fn());
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

  it("does not steal focus on first load", () => {
    renderApp();
    expect(document.activeElement).not.toBe(container.querySelector("main"));
  });

  it("moves focus to the resume when navigating there", async () => {
    renderApp();
    act(() => linkTo("RESUME").click());
    await flushLazy();

    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(document.activeElement).toBe(main);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("moves focus back to the world on the way out", async () => {
    renderApp("/resume");
    await flushLazy();
    act(() => linkTo("EXPLORE THE WORLD").click());
    await flushLazy();

    expect(document.activeElement).toBe(container.querySelector("main"));
  });

  it("leaves the case-study drawer alone, which manages its own focus", async () => {
    renderApp();
    act(() => {
      [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("BiLira"))?.click();
    });
    await flushLazy();

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    // The panel traps focus into the drawer; App must not pull it back to <main>.
    expect(document.activeElement).not.toBe(container.querySelector("main"));
  });
});
