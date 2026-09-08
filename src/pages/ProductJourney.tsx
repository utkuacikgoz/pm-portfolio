import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "../router";
import { PUBLISHED_PROJECTS, projectById } from "../projects/projects";
import { CONTACT } from "../content/contact";
import AvatarSelect from "../ui/AvatarSelect";
import ErrorBoundary from "../ui/ErrorBoundary";
import { useExperienceMode, useTouchSurf } from "../state/useExperienceMode";
import { T } from "../theme";
import "./product-journey.css";

const Harbor = lazy(() => import("../world/ProductHarbor"));
const ProjectPanel = lazy(() => import("../ui/ProjectPanel"));
type Stage = "welcome" | "character" | "harbor" | "before" | "after";
const BASE = "/?experience=3";

export default function ProductJourney() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("welcome");
  const [avatar, setAvatar] = useState("hr");
  const [indexOpen, setIndexOpen] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const mode = useExperienceMode();
  const touch = useTouchSurf();
  const panelProject = projectById(pathname.split("/")[2]);
  const heading = useRef<HTMLHeadingElement>(null);
  const readButton = useRef<HTMLButtonElement>(null);
  const isStory = stage === "before" || stage === "after";
  const canRender = mode === "world" || touch;

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => { if (stage !== "character") heading.current?.focus(); }, [stage]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || panelProject) return;
      if (indexOpen) setIndexOpen(false);
      else if (isStory) setStage("harbor");
      else if (stage === "character") setStage("welcome");
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [indexOpen, isStory, panelProject, stage]);

  const openCase = (id: string) => { setIndexOpen(false); navigate(`/p/${id}?experience=3`); };
  const fallback = <div className="journey-fallback" aria-hidden><span>01</span><p>Automated screening → human review</p></div>;

  return (
    <main className="product-journey" tabIndex={-1} style={{ "--journey-ink": T.ink, "--journey-text": T.text, "--journey-soft": T.textSoft, "--journey-muted": T.textMuted, "--journey-accent": T.seafoam } as React.CSSProperties}>
      <a href="#journey-copy" className="skip-link">Skip to project story</a>
      <div className="journey-scene" aria-hidden>
        {stage !== "welcome" && stage !== "character" && canRender ? (
          <ErrorBoundary area="world" fallback={fallback}>
            <Suspense fallback={<div className="journey-loading">Preparing your arrival…</div>}>
              <Harbor stage={isStory ? stage : "harbor"} avatar={avatar} paused={!!panelProject || !visible} />
            </Suspense>
          </ErrorBoundary>
        ) : fallback}
      </div>
      <div className="journey-shade" aria-hidden />
      <header className="journey-header">
        <a href={BASE} className="journey-brand"><img src="/utku-logo.svg" alt="" width="32" height="32" /><span>UTKU ACIKGOZ<small>PRODUCT WORLDS</small></span></a>
        <nav aria-label="Portfolio"><button onClick={() => setIndexOpen(v => !v)} aria-expanded={indexOpen} aria-controls="journey-projects">Projects <span aria-hidden>↗</span></button><a href="/UtkuAcikgoz-CV.pdf" download>CV ↓</a><a href={CONTACT.calendar} target="_blank" rel="noreferrer">Let’s talk ↗</a></nav>
      </header>

      {stage === "character" && <><h1 className="sr-only">Choose your character</h1><AvatarSelect onPick={id => { setAvatar(id); setStage("harbor"); }} /></>}

      <section id="journey-copy" className={`journey-copy ${stage === "welcome" ? "journey-welcome" : ""}`} hidden={stage === "character"}>
        <p className="journey-eyebrow">{stage === "welcome" ? "SENIOR TECHNICAL PRODUCT MANAGER" : stage === "harbor" ? "YOUR JOURNEY STARTS HERE" : "01 / BILIRA · FINTECH INFRASTRUCTURE"}</p>
        <h1 ref={heading} tabIndex={-1}>{stage === "welcome" ? <>Complex products.<br />A world to explore.</> : stage === "harbor" ? <>Welcome<br />to my world.</> : stage === "before" ? <>When every case<br />joins the queue.</> : <>Clear decisions.<br /><em>Human judgment.</em></>}</h1>
        <p className="journey-deck">{stage === "welcome" ? "I’m Utku. I lead teams building fintech infrastructure and marketplace products. Explore the decisions behind the work." : stage === "harbor" ? "Five projects. Five different challenges. Start with the decision that helped a compliance team move faster." : stage === "before" ? "A five-person compliance team faced a growing volume of manual reviews. The product challenge: increase capacity while preserving risk controls." : "Automated screening handles clear cases. Ambiguous ones reach a human reviewer. I led product strategy and aligned engineering and compliance on the workflow."}</p>
        {stage === "after" && <div className="journey-result" role="status"><strong>35%<span>less manual review time</span></strong><p>Reported outcome at BiLira.<br />Illustration shows the workflow, not measured traffic.</p></div>}
        <div className="journey-actions">
          {stage === "welcome" ? <button className="journey-primary" onClick={() => setStage("character")}>Choose your character <span>→</span></button> : stage === "harbor" ? <button className="journey-primary" onClick={() => setStage("before")}>Take me to BiLira <span>→</span></button> : <button className="journey-primary" aria-pressed={stage === "after"} onClick={() => setStage(stage === "before" ? "after" : "before")}>{stage === "before" ? "See the hybrid workflow" : "Replay the original workflow"}<span>↗</span></button>}
          {isStory ? <button ref={readButton} className="journey-text-button" onClick={() => openCase("bilira")}>Read the case study →</button> : <button className="journey-text-button" onClick={() => setIndexOpen(true)}>Choose a project ↗</button>}
        </div>
        {isStory && <p className="journey-role">Senior Product Manager · BiLira · 2025 to present</p>}
        {stage === "welcome" && <div className="journey-welcome-proof"><span>8+ years in product</span><span>11+ products shipped</span><span>Fintech · Marketplaces · AI</span></div>}
      </section>

      {isStory && <aside className="journey-legend" aria-label="Workflow legend"><span><i />{stage === "before" ? "Cases waiting for review" : "Clear cases"}</span><span><i className="amber" />Human review</span><small>CONCEPTUAL WORKFLOW</small></aside>}
      <footer className="journey-footer"><button onClick={() => { setIndexOpen(false); setStage(stage === "welcome" ? "character" : "harbor"); }}>{isStory ? "← Return to shore" : "◉ Your journey"}</button><span>{isStory ? (stage === "before" ? "01  THE BOTTLENECK" : "02  THE PRODUCT DECISION") : "EXPLORE AT YOUR OWN PACE"}</span><Link to="/?surf=1">Free surf ↗</Link></footer>

      {indexOpen && <section id="journey-projects" className="journey-index" aria-label="Choose a project"><div><h2>Choose your destination.</h2><button onClick={() => setIndexOpen(false)} aria-label="Close project index">✕</button></div><p>Open any case directly. Or explore the BiLira story in 3D.</p>{PUBLISHED_PROJECTS.map((p, i) => <button key={p.id} onClick={() => { if (p.id === "bilira") { setIndexOpen(false); setStage("before"); } else openCase(p.id); }}><span>0{i + 1}</span><strong>{p.title}<small>{p.tagline}</small></strong><span>↗</span></button>)}</section>}
      {panelProject && <Suspense fallback={<div className="journey-loading">Opening case study…</div>}><ProjectPanel project={panelProject} onClose={() => { navigate(BASE); requestAnimationFrame(() => readButton.current?.focus()); }} /></Suspense>}
    </main>
  );
}
