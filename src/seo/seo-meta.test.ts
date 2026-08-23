import { describe, expect, it } from "vitest";
import { buildRouteMeta } from "../../scripts/vite-seo-meta";
import { SEO_ROUTES } from "./routes";
import { PUBLISHED_PROJECTS } from "../projects/projects";

// The <head> metadata is generated at build time (scripts/vite-seo-meta.ts) so
// the case-study prose it is derived from stays out of the entry chunk. The
// hazard of any generated artifact is a SILENT miss: a project that produces no
// entry still builds, still renders, still passes every other test, and just
// quietly ships a blank title and description to every link preview.
//
// These assertions make that loud.
describe("generated route metadata", () => {
  const meta = buildRouteMeta();

  it("covers every route the prerenderer writes", () => {
    expect(Object.keys(meta).sort()).toEqual(SEO_ROUTES.map((r) => r.path).sort());
  });

  it("gives every published project a route with real strings", () => {
    for (const project of PUBLISHED_PROJECTS) {
      const entry = meta[`/p/${project.id}`];
      expect(entry, `no generated metadata for ${project.id}`).toBeDefined();
      expect(entry.title).toContain(project.title);
      // A description assembled from missing content collapses to punctuation
      // and whitespace, which is exactly the failure this test exists to catch.
      expect(entry.description.replace(/[\s.]/g, "").length).toBeGreaterThan(40);
      expect(entry.jsonLd.length).toBeGreaterThan(0);
    }
  });

  it("carries home and resume too", () => {
    for (const path of ["/", "/resume"]) {
      expect(meta[path]?.title).toBeTruthy();
      expect(meta[path]?.description.length).toBeGreaterThan(40);
    }
  });

  it("serializes to JSON, since that is how it reaches the browser", () => {
    // The plugin ships it via JSON.stringify. Anything non-serializable sneaking
    // into a route (a function, a Date) would silently change shape in the app.
    expect(JSON.parse(JSON.stringify(meta))).toEqual(meta);
  });
});
