import { describe, it, expect } from "vitest";
import {
  attributionLine,
  PROJECTS,
  PUBLISHED_PROJECTS,
  INDIE_PROJECTS,
  projectIndexById,
} from "./projects";

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
