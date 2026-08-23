import type { Plugin } from "vite";
import { SEO_ROUTES } from "../src/seo/routes";

/**
 * Emits the per-route <head> metadata as a virtual module, computed at BUILD
 * time from the project registry.
 *
 * Why this exists: `useSeo` runs in the browser on every navigation and needs a
 * title, description and JSON-LD per route. It used to get them by importing
 * `seo/routes.ts`, which derives the description and JSON-LD from
 * `project.content.beats` — the actual case-study prose. That made the full text
 * of all six case studies statically reachable from the entry chunk, so every
 * visitor downloaded ~16 KB gzip of case-study writing on first paint, including
 * mobile visitors on the flat map who never open one, purely so the browser tab
 * title could change on a client-side navigation.
 *
 * The strings are known at build time; nothing about them depends on the
 * visitor. So they are computed once, here, and the prose stays behind the lazy
 * ProjectPanel chunk where it is actually read.
 *
 * A PLUGIN rather than a committed generated file, on purpose. A checked-in
 * artifact would add a step to the extensibility contract ("add a content file +
 * a registry row + flip published"), and it would be a step whose failure is
 * silent: forget to regenerate and the new project ships a stale description
 * while everything still builds and passes. This regenerates on every build and
 * on every dev start, so there is nothing to forget.
 *
 * `summary` is deliberately NOT included: it is only read by the prerenderer
 * (scripts/vite-seo.ts) when writing the no-JS HTML, which runs under Node and
 * imports `routes.ts` directly.
 */
const VIRTUAL_ID = "virtual:seo-meta";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export interface RouteMeta {
  title: string;
  description: string;
  jsonLd: unknown[];
}

/** Exported for the test that proves every published route is covered. */
export function buildRouteMeta(): Record<string, RouteMeta> {
  const meta: Record<string, RouteMeta> = {};
  for (const route of SEO_ROUTES) {
    meta[route.path] = { title: route.title, description: route.description, jsonLd: route.jsonLd };
  }
  return meta;
}

export function seoMeta(): Plugin {
  return {
    name: "portfolio-seo-meta",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(buildRouteMeta())};`;
    },
  };
}
