import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "./ErrorBoundary";
import { EVENTS } from "../analytics/events";

const track = vi.hoisted(() => vi.fn());
vi.mock("../analytics/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../analytics/events")>()),
  track,
}));

function Boom(): never {
  throw new Error("the world fell over");
}

let container: HTMLDivElement;
let root: Root;

describe("ErrorBoundary", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    track.mockClear();
    // React logs caught errors; the test asserts on them instead of reading them.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("shows the fallback instead of a blank page when a child throws", () => {
    act(() => {
      root.render(
        <ErrorBoundary area="app" fallback={<p>fallback shown</p>}>
          <Boom />
        </ErrorBoundary>
      );
    });

    expect(container.textContent).toContain("fallback shown");
  });

  it("reports the crash, with the area and whether it was fatal", () => {
    act(() => {
      root.render(
        <ErrorBoundary area="app" fallback={<p>fallback</p>}>
          <Boom />
        </ErrorBoundary>
      );
    });

    expect(track).toHaveBeenCalledWith(
      EVENTS.appCrashed,
      expect.objectContaining({ area: "app", fatal: true, message: "the world fell over" })
    );
  });

  it("treats a world failure as non-fatal, since the flat map still works", () => {
    act(() => {
      root.render(
        <ErrorBoundary area="world" fallback={<p>flat map</p>}>
          <Boom />
        </ErrorBoundary>
      );
    });

    expect(track).toHaveBeenCalledWith(
      EVENTS.appCrashed,
      expect.objectContaining({ area: "world", fatal: false })
    );
  });

  it("renders children untouched when nothing throws", () => {
    act(() => {
      root.render(
        <ErrorBoundary area="app" fallback={<p>fallback</p>}>
          <p>all good</p>
        </ErrorBoundary>
      );
    });

    expect(container.textContent).toBe("all good");
    expect(track).not.toHaveBeenCalled();
  });
});
