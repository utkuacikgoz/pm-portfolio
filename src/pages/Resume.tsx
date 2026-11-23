import { useEffect } from "react";
import { Link } from "../router";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS, attributionLine, isLive, LIVE_INDIE_WORD } from "../projects/projects";
import { useProgress } from "../state/progress";
import { CONTACT } from "../content/contact";
import { EVENTS, track } from "../analytics/events";
import { T, TYPE, textAccent } from "../theme";

// "WEBSITE" used to point at utkuacikgoz.com, which is now this same site; the
// slot is worth more as the booking link.
const CONTACTS = [
  { id: "email", label: "EMAIL", href: `mailto:${CONTACT.email}`, color: T.gold },
  { id: "linkedin", label: "LINKEDIN", href: CONTACT.linkedin, color: T.blue },
  { id: "book_call", label: "BOOK A CALL", href: CONTACT.calendar, color: T.mauve },
];

const EMPLOYMENT = PUBLISHED_PROJECTS;
const INDIE = INDIE_PROJECTS;


/**
 * The <30s escape hatch: fast, plain-DOM résumé. No 3D, no animation. Skimmable
 * outcomes with deep links into each case study, plus a CV download.
 */
export default function Resume() {
  const { read } = useProgress();

  // The pageview already records the path; this names the moment so "arrived,
  // then went straight for the resume" is one step in a funnel.
  useEffect(() => {
    track(EVENTS.resumeOpened);
  }, []);

  return (
    <main tabIndex={-1} className="page-in" style={{ minHeight: "100vh", padding: "64px 24px 96px", maxWidth: 800, margin: "0 auto", outline: "none" }}>
      <Link
        to="/"
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          padding: "10px 18px",
          border: `2px solid ${T.text}`,
          color: T.text,
          fontSize: TYPE.small,
          fontWeight: 800,
        }}
      >
        ← EXPLORE THE WORLD
      </Link>

      <header style={{ marginTop: 24, marginBottom: 12 }}>
        <img src="/utku-logo.svg" alt="" width={48} height={48} style={{ marginBottom: 14 }} />
        <h1 style={{ fontSize: "clamp(34px, 8vw, 48px)", fontWeight: 900 }}>Utku Acikgoz</h1>
        <p style={{ color: textAccent(T.blue), fontSize: TYPE.lead, fontWeight: 700, marginTop: 6 }}>
          Senior Technical Product Manager
        </p>
        {/* The claim leads, the credentials follow. This used to open "8+ years
            and 11+ products shipped across fintech, ecommerce and marketplaces",
            which is a sentence every senior PM writes and tells a recruiter
            nothing they cannot get from the CV. The claim below is the one
            through-line four of the five case studies already make in their own
            closing insights, so each example here is evidence the reader can go
            and check rather than a line of positioning. */}
        <p style={{ color: T.text, fontSize: TYPE.lead, marginTop: 14, lineHeight: 1.6, maxWidth: 680 }}>
          I earn the big change by shipping a small result first. Cart recovery before Mestores rebuilt its
          platform. A locator staff could use before Apollo connected hospital, pharmacy and inventory. The
          clear half of compliance automated before BiLira touched the ambiguous half.
        </p>
        <p style={{ color: T.textSoft, fontSize: TYPE.body, marginTop: 12, lineHeight: 1.75, maxWidth: 680 }}>
          8+ years, 11+ products shipped, distributed teams of up to 25 people, and a five-person product and
          design function I built. I do the same on my own time: {LIVE_INDIE_WORD} products live. Certified Scrum
          Master (PSM I) and Product Owner (PSPO I).
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20, alignItems: "center" }}>
          <a
            href="/UtkuAcikgoz-CV.pdf"
            download
            onClick={() => track(EVENTS.cvDownloaded, { location: "resume" })}
            style={{ padding: "9px 18px", background: T.text, color: T.ink, fontSize: TYPE.small, fontWeight: 800 }}
          >
            ↓ DOWNLOAD CV
          </a>
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noopener" : undefined}
              onClick={() => track(EVENTS.ctaClicked, { cta: c.id, location: "resume" })}
              // One primary, three quiet. These carried a 2px border in their own
              // accent, so four buttons in four colours sat at equal weight and
              // none of them read as the ask. The border is now the neutral one
              // and only the label keeps its accent, which leaves the filled CV
              // button as the single obvious action.
              style={{ padding: "8px 16px", border: `1px solid ${T.border}`, color: textAccent(c.color), fontSize: TYPE.small, fontWeight: 700 }}
            >
              {c.label}
            </a>
          ))}
        </div>
      </header>

      <Section title="SELECTED WORK">
        {EMPLOYMENT.map((p) => (
          <Row
            key={p.id}
            to={`/p/${p.id}`}
            accent={p.accent}
            title={p.title}
            sub={p.tagline}
            attribution={attributionLine(p)}
            cta={read.has(p.id) ? "READ ✓" : "VIEW →"}
            read={read.has(p.id)}
          />
        ))}
      </Section>

      {INDIE.length > 0 && (
        <Section title="BUILDING ON MY OWN TIME">
          {INDIE.map((p) => {
            const live = isLive(p);
            const body = (
              <>
                <span>
                  <span style={{ display: "block", fontSize: TYPE.lead, fontWeight: 800 }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: TYPE.small, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                    {p.glimpse ?? p.tagline}
                  </span>
                </span>
                <span style={{ color: textAccent(p.accent), fontSize: TYPE.micro, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  {live ? "LIVE →" : "IN DEVELOPMENT"}
                </span>
              </>
            );
            const style = {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              padding: "16px 20px",
              background: T.inkRaised,
              borderLeft: `4px solid ${p.accent}`,
              textDecoration: "none",
              color: T.text,
            };
            return (
              <li key={p.id}>
                {live ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track(EVENTS.indieProductOpened, { project_id: p.id })}
                    style={style}
                  >
                    {body}
                  </a>
                ) : (
                  <div style={style}>{body}</div>
                )}
              </li>
            );
          })}
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 style={{ fontSize: TYPE.title, fontWeight: 900, margin: "40px 0 18px", letterSpacing: 1 }}>{title}</h2>
      <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>{children}</ul>
    </>
  );
}

function Row({
  to,
  accent,
  title,
  sub,
  attribution,
  cta,
  read,
}: {
  to: string;
  accent: string;
  title: string;
  sub: string;
  attribution?: string | null;
  cta: string;
  read?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          padding: "16px 20px",
          background: T.inkRaised,
          borderLeft: `4px solid ${accent}`,
          color: T.text,
        }}
      >
        <span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: TYPE.lead, fontWeight: 800 }}>
            {title}
            {read && <span aria-label="read" style={{ color: textAccent(accent), fontSize: TYPE.small }}>✓</span>}
          </span>
          <span style={{ display: "block", fontSize: TYPE.small, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>{sub}</span>
          {attribution && (
            <span style={{ display: "block", fontSize: TYPE.micro, color: T.textMuted, marginTop: 5, letterSpacing: 0.2 }}>
              {attribution}
            </span>
          )}
        </span>
        <span style={{ color: textAccent(accent), fontSize: TYPE.small, fontWeight: 700, whiteSpace: "nowrap" }}>{cta}</span>
      </Link>
    </li>
  );
}
