import { Routes, Route, Navigate } from "react-router-dom";
import WorldExperience from "./pages/WorldExperience";
import Resume from "./pages/Resume";

export default function App() {
  return (
    <Routes>
      {/* World + deep-linkable open panel share one element (URL = source of truth). */}
      <Route path="/" element={<WorldExperience />} />
      <Route path="/p/:id" element={<WorldExperience />} />
      {/* Persistent escape hatch: fast, plain résumé. */}
      <Route path="/resume" element={<Resume />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
