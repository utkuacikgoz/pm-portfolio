import { bilira } from "./bilira";
import { upshift } from "./upshift";
import { mestores } from "./mestores";

export type CaseStudyId = "bilira" | "upshift" | "mestores";

export const CASE_STUDIES = {
  bilira,
  upshift,
  mestores,
};

export const getCaseStudy = (id: CaseStudyId) => {
  return CASE_STUDIES[id];
};
