import { Suspense, lazy, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "./router";
import WorldExperience from "./pages/WorldExperience";

// The resume is a separate route nobody sees on first paint, so it ships as its
// own chunk rather than riding in the entry bundle.
const Resume = lazy(() => import("./pages/Resume"));
const ProductJourney = lazy(() => import("./pages/ProductJourney"));
import { projectIndexById } from "./projects/projects";
import { useSeo } from "./seo/useSeo";

export default function App() {
  const { pathname, search } = useLocation();
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

  // Moving between the world and the resume swaps the whole page under a
  // keyboard or screen-reader user without telling them: focus stays on a link
  // that no longer exists, so it falls to <body> and nothing is announced.
  // Focusing the new page's <main> puts them at the top of the content they just
  // asked for, and its heading gets read out.
  //
  // Deliberately keyed on which PAGE is showing rather than on pathname. Opening
  // a case study is also a route change, but it stays on the world page, and
  // ProjectPanel already manages that focus itself (it traps into the drawer and
  // WorldExperience restores the opener on close). Firing here would fight it:
  // a parent's effect runs after its children's, so this would land last and
  // steal focus out of the drawer every time.
  const page = pathname === "/resume" ? "resume" : "world";
  // Seeded with the current page so a fresh load or a deep link is not a
  // transition; the hero's own autoFocus keeps the entry point.
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    window.scrollTo(0, 0);

    // The resume is a lazy chunk behind a null fallback, so on the first visit
    // its <main> does not exist yet when this runs: the old page has unmounted
    // and the new one has not arrived. Wait for the insertion rather than
    // polling on a timer, which would silently give up on a slow connection and
    // work fine everywhere it was tested.
    const focusMain = () => {
      const main = document.querySelector<HTMLElement>("main");
      if (main) main.focus();
      return !!main;
    };
    if (focusMain()) return;
    const observer = new MutationObserver(() => {
      if (focusMain()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [page]);

  // World + deep-linkable panels share one element (URL = source of truth).
  if (isWorldRoute && isKnownProject && new URLSearchParams(search).get("experience") === "3") {
    return <Suspense fallback={null}><ProductJourney /></Suspense>;
  }
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
