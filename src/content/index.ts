import { bilira } from "./bilira";
import { upshift } from "./upshift";
import { mestores } from "./mestores";
import { apollo } from "./apollo";
import { mona } from "./mona";
import { la3eb } from "./la3eb";

export type CaseStudyId = "bilira" | "upshift" | "mestores" | "apollo" | "mona" | "la3eb";

export const CASE_STUDIES = {
  bilira,
  upshift,
  mestores,
  apollo,
  mona,
  la3eb,
};

export const getCaseStudy = (id: CaseStudyId) => {
  return CASE_STUDIES[id];
};
