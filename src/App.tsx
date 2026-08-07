import { Suspense, lazy, useEffect } from "react";
import { useLocation, useNavigate } from "./router";
import WorldExperience from "./pages/WorldExperience";

// The resume is a separate route nobody sees on first paint, so it ships as its
// own chunk rather than riding in the entry bundle.
const Resume = lazy(() => import("./pages/Resume"));
import { projectIndexById } from "./projects/projects";
import { useSeo } from "./seo/useSeo";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // Head follows the URL: the build prerenders each route, this keeps it right
  // once the SPA is driving.
  useSeo(pathname);
  const isWorldRoute = pathname === "/" || /^\/p\/[^/]+$/.test(pathname);
  const projectId = pathname.match(/^\/p\/([^/]+)$/)?.[1];
  const isKnownProject = !projectId || projectIndexById(decodeURIComponent(projectId)) >= 0;

  useEffect(() => {
    if ((!isWorldRoute && pathname !== "/resume") || !isKnownProject) navigate("/", { replace: true });
  }, [isKnownProject, isWorldRoute, navigate, pathname]);

  // World + deep-linkable panels share one element (URL = source of truth).
  if (isWorldRoute && isKnownProject) return <WorldExperience />;
  // Persistent escape hatch: fast, plain résumé.
  if (pathname === "/resume") {
    return (
      <Suspense fallback={null}>
        <Resume />
      </Suspense>
    );
  }
  return null;
}
