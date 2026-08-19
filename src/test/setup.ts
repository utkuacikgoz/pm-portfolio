// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
// for any component/DOM tests. Pure-logic tests don't need it, but it's cheap
// to have available globally.
import "@testing-library/jest-dom";

// jsdom implements neither Element.prototype.scrollTo nor window.scrollTo, and
// real components call both: ProjectPanel resets the drawer to the top on open,
// App resets the window on a page change. Any test rendering those crashed with
// "scrollTo is not a function" unless it happened to stub the prototype itself.
//
// Two files did, so whether a third passed depended on which worker it landed in
// and what had already polluted the prototype. That is exactly how the world
// heading suite passed locally and on one CI run, then failed on the next.
// Stubbing here makes every file self-sufficient. Tests that want to assert on
// scrolling still override with their own spy.
if (!Element.prototype.scrollTo) {
  Object.defineProperty(Element.prototype, "scrollTo", {
    configurable: true,
    writable: true,
    value: () => {},
  });
}
if (typeof window.scrollTo !== "function") {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: () => {},
  });
}

// jsdom has no IntersectionObserver either, and ProjectPanel builds one to reveal
// beats as they scroll. Same story as scrollTo: it was stubbed in whichever files
// happened to need it, so a new test that mounted the drawer crashed. A no-op
// default means observing simply never fires, which is the right baseline; a test
// that wants to drive reveals can stub its own.
if (!("IntersectionObserver" in globalThis)) {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly scrollMargin = "0px";
    readonly thresholds: readonly number[] = [0];
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: NoopIntersectionObserver,
  });
}
