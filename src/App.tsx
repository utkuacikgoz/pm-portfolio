import { useEffect } from "react";
import { useLocation, useNavigate } from "./router";
import WorldExperience from "./pages/WorldExperience";
import Resume from "./pages/Resume";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isWorldRoute = pathname === "/" || /^\/p\/[^/]+$/.test(pathname);

  useEffect(() => {
    if (!isWorldRoute && pathname !== "/resume") navigate("/", { replace: true });
  }, [isWorldRoute, navigate, pathname]);

  // World + deep-linkable panels share one element (URL = source of truth).
  if (isWorldRoute) return <WorldExperience />;
  // Persistent escape hatch: fast, plain résumé.
  if (pathname === "/resume") return <Resume />;
  return null;
}
