import { useState } from "react";
import { useCaseStudy, CaseStudyId } from "./content/useCaseStudy";
import LandingPage from "./pages/LandingPage";
import CaseStudyPage from "./pages/CaseStudyPage";

export default function App() {
  const { caseStudy, setCase } = useCaseStudy();
  const [viewingCase, setViewingCase] = useState(false);

  const handleCaseClick = (caseId: CaseStudyId) => {
    setCase(caseId);
    setViewingCase(true);
  };

  const handleBack = () => {
    setViewingCase(false);
  };

  return (
    <>
      {!viewingCase ? (
        <LandingPage onCaseClick={handleCaseClick} />
      ) : (
        <CaseStudyPage caseStudy={caseStudy} onBack={handleBack} />
      )}
    </>
  );
}