import { useState } from "react";
import { CASE_STUDIES, CaseStudyId } from ".";

let currentCase: CaseStudyId = "bilira";

export type { CaseStudyId };

export function useCaseStudy() {
  const [activeCase, setActiveCase] = useState<CaseStudyId>(currentCase);

  const setCase = (id: CaseStudyId) => {
    currentCase = id;
    setActiveCase(id);
  };

  return {
    caseStudy: CASE_STUDIES[activeCase],
    activeCase,
    setCase,
  };
}
