import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BrowserRouter, Link, useLocation, useNavigate, useParams } from "./router";

let container: HTMLDivElement;
let root: Root;

function Probe() {
  const { pathname, search, hash } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      <span data-testid="pathname">{pathname}</span>
      <span data-testid="search">{search}</span>
      <span data-testid="hash">{hash}</span>
      <span data-testid="id">{id ?? ""}</span>
      <button onClick={() => navigate("/p/bilira?from=surf#results")}>go</button>
      <Link to="/resume?ref=card">resume</Link>
    </div>
  );
}

const read = (key: string) =>
  container.querySelector<HTMLElement>(`[data-testid="${key}"]`)?.textContent ?? "";

function render(url: string) {
  window.history.replaceState(null, "", url);
  act(() =>
    root.render(
      <BrowserRouter>
        <Probe />
      </BrowserRouter>
    )
  );
}

describe("router", () => {
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState(null, "", "/");
  });

  it("reads the query and fragment off a cold load", () => {
    render("/p/bilira?utm_source=linkedin#metrics");
    expect(read("pathname")).toBe("/p/bilira");
    expect(read("search")).toBe("?utm_source=linkedin");
    expect(read("hash")).toBe("#metrics");
    expect(read("id")).toBe("bilira");
  });

  // The bug this file exists for: `navigate` pushed the full URL, so the address
  // bar was right while the router's own state had already dropped the query.
  // A link carrying state worked on a cold load and lost it on the first move.
  it("keeps the query and fragment across a client-side navigation", () => {
    render("/");
    act(() => container.querySelector("button")!.click());
    expect(read("pathname")).toBe("/p/bilira");
    expect(read("search")).toBe("?from=surf");
    expect(read("hash")).toBe("#results");
    expect(window.location.search).toBe("?from=surf");
  });

  it("keeps them when a Link carries one", () => {
    render("/");
    act(() => container.querySelector("a")!.click());
    expect(read("pathname")).toBe("/resume");
    expect(read("search")).toBe("?ref=card");
  });

  it("clears them again when the next navigation has none", () => {
    render("/p/bilira?from=surf#results");
    act(() => container.querySelector("a")!.click());
    expect(read("hash")).toBe("");
    act(() => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(read("search")).toBe("");
  });

  it("follows back and forward", () => {
    render("/?surf=1");
    expect(read("search")).toBe("?surf=1");
    act(() => {
      window.history.replaceState(null, "", "/p/apollo?x=2");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(read("pathname")).toBe("/p/apollo");
    expect(read("search")).toBe("?x=2");
    expect(read("id")).toBe("apollo");
  });

  // `useParams` matches on the pathname, so a query must not leak into the id.
  it("never lets a query string become part of a project id", () => {
    render("/p/la3eb?share=1");
    expect(read("id")).toBe("la3eb");
  });
});
