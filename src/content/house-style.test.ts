import { describe, expect, it } from "vitest";
import { CASE_STUDIES } from "./index";
import type { CaseStudy } from "./types";
import { CONTACT } from "./contact";
import { PROJECTS, attributionLine } from "../projects/projects";
import { SEO_ROUTES } from "../seo/routes";
import { REEL_COPY } from "../ui/reel/drawReel";

/**
 * House style (CLAUDE.md): no dashes in visible copy, ever. No em dash, no en
 * dash, no minus sign, in any rendered string; ranges read as "X to Y".
 *
 * The rule has held by discipline alone, which works right up until someone
 * pastes a line out of a document that uses them. Comments are exempt, so this
 * checks the strings themselves rather than the source files.
 */
const DASHES = /[–—−]/;

/** Every string reachable from a value, at any depth. */
function strings(value: unknown, path = "$"): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, i) => strings(item, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => strings(item, `${path}.${key}`));
  }
  return [];
}

function expectNoDashes(entries: [string, string][]) {
  const offenders = entries.filter(([, text]) => DASHES.test(text));
  expect(offenders.map(([path, text]) => `${path}: ${text}`)).toEqual([]);
}

describe("house style: no dashes in visible copy", () => {
  it("holds across every case study", () => {
    for (const [id, study] of Object.entries(CASE_STUDIES as Record<string, CaseStudy>)) {
      expectNoDashes(strings(study, id));
    }
  });

  it("holds across the project registry, including taglines and attribution", () => {
    expectNoDashes(strings(PROJECTS, "projects"));
    expectNoDashes(PROJECTS.map((p) => [p.id, attributionLine(p) ?? ""] as [string, string]));
  });

  it("holds across contact details and every SEO route", () => {
    expectNoDashes(strings(CONTACT, "contact"));
    // Titles, descriptions, no-JS summaries and JSON-LD all render or are read.
    expectNoDashes(strings(SEO_ROUTES, "seo"));
  });

  it("holds across every string the entry reel paints, hyphens included", () => {
    // Stricter than DASHES: the reel sets type at display sizes, where even a
    // hyphen or a figure dash reads as a dash. U+2010 to U+2015, the minus sign,
    // and an ASCII hyphen between words are all out.
    const REEL_DASHES = /[\u2010-\u2015\u2212]|\S-\S|\s-\s/;
    const offenders = REEL_COPY.filter((text) => REEL_DASHES.test(text));
    expect(offenders).toEqual([]);
    expectNoDashes(REEL_COPY.map((text, i) => [`reel[${i}]`, text] as [string, string]));
  });
});
