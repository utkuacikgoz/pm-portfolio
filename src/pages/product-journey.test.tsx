import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { BrowserRouter } from "../router";
import ProductJourney from "./ProductJourney";

vi.mock("../state/useExperienceMode", () => ({ useExperienceMode: () => "world", useTouchSurf: () => false }));
vi.mock("../world/ProductHarbor", () => ({ default: ({ paused }: { paused: boolean }) => <div data-testid="harbor" data-paused={paused} /> }));

let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  await import("../ui/ProjectPanel");
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, "", "/?experience=3");
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

async function click(text: string) {
  const button = [...container.querySelectorAll("button")].find(el => el.textContent?.includes(text));
  expect(button, text).toBeDefined();
  await act(async () => button!.click());
}

it("keeps the chosen workflow state when reading and returning from its case", async () => {
  await act(async () => root.render(<BrowserRouter><ProductJourney /></BrowserRouter>));
  expect(container.querySelector('[data-testid="harbor"]')).toBeNull();
  await click("Choose your character");
  await click("Recruiter");
  await click("Take me to BiLira");
  await click("See the hybrid workflow");
  expect(container.textContent).toContain("35%");
  await click("Read the case study");
  expect(window.location.pathname).toBe("/p/bilira");
  expect(container.querySelector('[data-testid="harbor"]')).toHaveAttribute("data-paused", "true");
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Close case study"]')!.click());
  expect(window.location.search).toBe("?experience=3");
  expect(container.textContent).toContain("Replay the original workflow");
  expect(container.querySelector('[data-testid="harbor"]')).toHaveAttribute("data-paused", "false");
  await click("Replay the original workflow");
  expect(container.querySelector("h1")?.textContent).toContain("joins the queue");
});

it("lets visitors reach a case directly without completing the guided journey", async () => {
  await act(async () => root.render(<BrowserRouter><ProductJourney /></BrowserRouter>));
  await click("Choose a project");
  await click("Upshift");
  expect(window.location.pathname).toBe("/p/upshift");
  expect(container.querySelector('[aria-label="Upshift case study"]')).not.toBeNull();
});
