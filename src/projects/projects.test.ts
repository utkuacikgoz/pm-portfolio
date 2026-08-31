import { describe, it, expect } from "vitest";
import { attributionLine, PROJECTS, PUBLISHED_PROJECTS, INDIE_PROJECTS, projectIndexById, isLive } from "./projects";

describe("project registry invariants", () => {
  it("has unique project ids", () => {
    const ids = PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every project carries the required display fields", () => {
    for (const p of PROJECTS) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(["employment", "indie"]).toContain(p.kind);
      expect(p.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("PUBLISHED_PROJECTS is exactly the published subset", () => {
    expect(PUBLISHED_PROJECTS.length).toBeGreaterThan(0);
    expect(PUBLISHED_PROJECTS.every((p) => p.published)).toBe(true);
    expect(PUBLISHED_PROJECTS).toEqual(PROJECTS.filter((p) => p.published));
  });

  it("INDIE_PROJECTS are indie glimpses with teaser copy", () => {
    for (const p of INDIE_PROJECTS) {
      expect(p.kind).toBe("indie");
      expect(p.glimpse).toBeTruthy();
    }
  });
});

describe("projectIndexById", () => {
  it("resolves a published id to its rail position", () => {
    const first = PUBLISHED_PROJECTS[0];
    expect(projectIndexById(first.id)).toBe(0);
    const last = PUBLISHED_PROJECTS[PUBLISHED_PROJECTS.length - 1];
    expect(projectIndexById(last.id)).toBe(PUBLISHED_PROJECTS.length - 1);
  });

  it("returns -1 for undefined or unknown ids", () => {
    expect(projectIndexById(undefined)).toBe(-1);
    expect(projectIndexById("does-not-exist")).toBe(-1);
  });
});

describe("attribution", () => {
  // The CV lists four employers: BiLira, Upshift, Lean Scale, Technolera. The
  // world shows five islands. Without an employer on every one, three of them
  // read as roles that are not in the employment history, which is the single
  // most expensive thing a recruiter can notice on a portfolio.
  const CV_EMPLOYERS = new Set(["BiLira", "Upshift", "Lean Scale", "Technolera"]);

  it("places every published project at an employer that exists on the CV", () => {
    for (const project of PUBLISHED_PROJECTS) {
      expect(project.org, `${project.id} has no employer`).toBeTruthy();
      expect(CV_EMPLOYERS.has(project.org as string), `${project.id}: ${project.org}`).toBe(true);
      expect(project.role).toBeTruthy();
      expect(project.period).toBeTruthy();
    }
  });

  it("says so explicitly when the work was a client engagement", () => {
    const leanScale = PUBLISHED_PROJECTS.filter((p) => p.org === "Lean Scale");
    expect(leanScale.length).toBeGreaterThan(0);
    for (const project of leanScale) {
      expect(project.clientWork).toBe(true);
      expect(attributionLine(project)).toContain("client engagement");
    }
  });

  it("renders a line that names the role, the employer and the years", () => {
    const bilira = PUBLISHED_PROJECTS.find((p) => p.id === "bilira");
    expect(attributionLine(bilira!)).toBe("Senior Product Manager, BiLira, 2025 to present");
  });
});

describe("live indie products", () => {
  // The shelf's whole job is credibility. A product that exists, described as
  // forthcoming, is worth less than not mentioning it at all, so "live" is
  // driven by whether there is somewhere to actually send someone.
  it("marks a product live exactly when it has somewhere to send you", () => {
    for (const p of INDIE_PROJECTS) {
      expect(isLive(p)).toBe(Boolean(p.url));
    }
  });

  it("has at least one live product, since one is shipped", () => {
    expect(INDIE_PROJECTS.filter(isLive).length).toBeGreaterThan(0);
  });

  // A dead or relative link on the shelf is worse than a quiet row: it is a
  // broken promise a recruiter clicks.
  it("points every live product at an absolute https URL with no trailing slash", () => {
    for (const p of INDIE_PROJECTS.filter(isLive)) {
      expect(p.url, `${p.id} url`).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i);
      expect(p.url).not.toMatch(/\/$/);
    }
  });

  it("keeps live products off the career rail, which is employment only", () => {
    for (const p of INDIE_PROJECTS) {
      expect(p.published).toBe(false);
      expect(p.kind).toBe("indie");
    }
  });

  it("gives every indie row a glimpse line, live or not", () => {
    for (const p of INDIE_PROJECTS) {
      expect(p.glimpse && p.glimpse.length).toBeGreaterThan(10);
    }
  });
});
