import type { Project } from "../projects/projects";

interface Props {
  projects: Project[];
  active: number;
  onFocus: (index: number) => void;
  onOpen: (index: number) => void;
}

/**
 * Screen-reader / keyboard path through the world. Visually hidden but fully
 * focusable: Tab moves between islands (camera follows focus via onFocus),
 * Enter/Space opens the case study. This single list IS the a11y layer AND
 * the source of truth the flat fallback mirrors.
 */
export default function WorldNav({ projects, active, onFocus, onOpen }: Props) {
  return (
    <nav aria-label="Career world — projects" className="sr-only">
      <ul>
        {projects.map((p, i) => (
          <li key={p.id}>
            <button
              aria-current={i === active ? "true" : undefined}
              onFocus={() => onFocus(i)}
              onClick={() => onOpen(i)}
            >
              {p.title} — {p.tagline}. Open case study.
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
