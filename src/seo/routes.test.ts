import { describe, expect, it } from "vitest";
import { PUBLISHED_PROJECTS } from "../projects/projects";
import { INDEXABLE, ROBOTS_CONTENT, SEO_ROUTES, SITE_URL, canonicalUrl, seoForPath } from "./routes";

describe("SEO_ROUTES", () => {
  it("covers home, resume and every published project", () => {
    const paths = SEO_ROUTES.map((r) => r.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/resume");
    for (const project of PUBLISHED_PROJECTS) {
      expect(paths).toContain(`/p/${project.id}`);
    }
    expect(paths).toHaveLength(PUBLISHED_PROJECTS.length + 2);
  });

  it("gives every route a unique, length-safe title and description", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const route of SEO_ROUTES) {
      expect(route.title.length).toBeGreaterThan(10);
      expect(route.title.length).toBeLessThanOrEqual(70);
      expect(route.description.length).toBeGreaterThan(50);
      expect(route.description.length).toBeLessThanOrEqual(165);
      titles.add(route.title);
      descriptions.add(route.description);
    }

    expect(titles.size).toBe(SEO_ROUTES.length);
    expect(descriptions.size).toBe(SEO_ROUTES.length);
  });

  it("keeps dashes out of visible copy (house style)", () => {
    for (const route of SEO_ROUTES) {
      expect(`${route.title} ${route.description} ${route.summary.join(" ")}`).not.toMatch(/[—–]/);
    }
  });

  it("ships crawlable summary copy for every route", () => {
    for (const route of SEO_ROUTES) {
      expect(route.summary.length).toBeGreaterThan(0);
      expect(route.jsonLd.length).toBeGreaterThan(0);
    }
  });
});

describe("indexing posture", () => {
  it("serves noindex, and never pairs it with a crawl block", () => {
    // The pairing matters: a robots.txt Disallow would stop crawlers reading the
    // noindex, which is how bare URLs end up listed anyway. See routes.ts.
    expect(ROBOTS_CONTENT).toBe(INDEXABLE ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, follow");
    expect(ROBOTS_CONTENT).toContain("follow");
  });
});

describe("seoForPath", () => {
  it("matches a project route, with or without a trailing slash", () => {
    const id = PUBLISHED_PROJECTS[0].id;
    expect(seoForPath(`/p/${id}`).path).toBe(`/p/${id}`);
    expect(seoForPath(`/p/${id}/`).path).toBe(`/p/${id}`);
  });

  it("falls back to home for anything unknown", () => {
    expect(seoForPath("/nope").path).toBe("/");
    expect(seoForPath("/").path).toBe("/");
  });
});

describe("canonicalUrl", () => {
  it("builds absolute, parameter-free urls on the apex domain", () => {
    expect(canonicalUrl("/")).toBe(`${SITE_URL}/`);
    expect(canonicalUrl("/resume")).toBe(`${SITE_URL}/resume`);
    expect(SITE_URL).toBe("https://utkuacikgoz.com");
  });
});
