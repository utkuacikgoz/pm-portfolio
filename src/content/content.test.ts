import { describe, it, expect } from "vitest";
import { CASE_STUDIES, getCaseStudy, type CaseStudyId } from "./index";

const IDS: CaseStudyId[] = ["bilira", "upshift", "mestores", "apollo", "mona", "la3eb"];

describe("case-study registry", () => {
  it("exposes exactly the declared case-study ids", () => {
    expect(Object.keys(CASE_STUDIES).sort()).toEqual([...IDS].sort());
  });

  it("getCaseStudy returns a defined study for every id", () => {
    for (const id of IDS) {
      const study = getCaseStudy(id);
      expect(study).toBeDefined();
      expect(study).toBe(CASE_STUDIES[id]);
    }
  });
});
