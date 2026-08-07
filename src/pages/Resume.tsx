import { useEffect } from "react";
import { Link } from "../router";
import { PUBLISHED_PROJECTS, INDIE_PROJECTS } from "../projects/projects";
import { useProgress } from "../state/progress";
import { CONTACT } from "../content/contact";
import { EVENTS, track } from "../analytics/events";
import { T, textAccent } from "../theme";

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
    <div className="page-in" style={{ minHeight: "100vh", padding: "64px 24px 96px", maxWidth: 800, margin: "0 auto" }}>
      <Link
        to="/"
        style={{
          position: "fixed",
          top: 20,
          left: 24,
          padding: "10px 18px",
          border: `2px solid ${T.text}`,
          color: T.text,
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        ← EXPLORE THE WORLD
      </Link>

      <header style={{ marginTop: 24, marginBottom: 12 }}>
        <img src="/utku-logo.svg" alt="" width={48} height={48} style={{ marginBottom: 14 }} />
        <h1 style={{ fontSize: "clamp(34px, 8vw, 48px)", fontWeight: 900 }}>Utku Acikgoz</h1>
        <p style={{ color: textAccent(T.blue), fontSize: 18, fontWeight: 700, marginTop: 6 }}>
          Senior Product Manager
        </p>
        <p style={{ color: T.textSoft, fontSize: 15, marginTop: 12, lineHeight: 1.75 }}>
          8+ years and 11+ products shipped across fintech, blockchain, ecommerce, food delivery and
          marketplaces. I lead distributed teams, up to 25 people across Turkey, the UAE, KSA and the
          US, and lean hard on analytics and AI to ship. Certified Scrum Master (PSM I) and Product
          Owner (PSPO I).
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20, alignItems: "center" }}>
          <a
            href="/UtkuAcikgoz-CV.pdf"
            download
            onClick={() => track(EVENTS.cvDownloaded, { location: "resume" })}
            style={{ padding: "9px 18px", background: T.text, color: T.ink, fontSize: 13, fontWeight: 800 }}
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
              style={{ padding: "8px 16px", border: `2px solid ${c.color}`, color: textAccent(c.color), fontSize: 13, fontWeight: 700 }}
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
            cta={read.has(p.id) ? "READ ✓" : "VIEW →"}
            read={read.has(p.id)}
          />
        ))}
      </Section>

      {INDIE.length > 0 && (
        <Section title="CURRENTLY BUILDING">
          {INDIE.map((p) => (
            <li key={p.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: T.inkRaised,
                  borderLeft: `4px solid ${p.accent}`,
                }}
              >
                <span>
                  <span style={{ display: "block", fontSize: 18, fontWeight: 800 }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: 13, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                    {p.glimpse ?? p.tagline}
                  </span>
                </span>
                <span style={{ color: textAccent(p.accent), fontSize: 11, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  COMING SOON
                </span>
              </div>
            </li>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: "40px 0 18px", letterSpacing: 1 }}>{title}</h2>
      <ul style={{ listStyle: "none", display: "grid", gap: 12 }}>{children}</ul>
    </>
  );
}

function Row({
  to,
  accent,
  title,
  sub,
  cta,
  read,
}: {
  to: string;
  accent: string;
  title: string;
  sub: string;
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
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 800 }}>
            {title}
            {read && <span aria-label="read" style={{ color: textAccent(accent), fontSize: 13 }}>✓</span>}
          </span>
          <span style={{ display: "block", fontSize: 13, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>{sub}</span>
        </span>
        <span style={{ color: textAccent(accent), fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{cta}</span>
      </Link>
    </li>
  );
}
