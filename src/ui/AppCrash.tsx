import { CONTACT } from "../content/contact";
import { T, TYPE } from "../theme";

/**
 * What a visitor sees if the app itself throws. Deliberately dependency-light:
 * plain anchors rather than the router (the router may be what broke) and no 3D,
 * no analytics call of its own, no state.
 *
 * The job here is not to apologise, it is to make sure a recruiter who hit a bug
 * still leaves with the resume and an email address.
 */
export default function AppCrash() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
        textAlign: "center",
        background: T.ink,
        color: T.text,
      }}
    >
      <img src="/utku-logo.svg" alt="" width={48} height={48} />
      <h1 style={{ fontSize: TYPE.display, fontWeight: 900, letterSpacing: -0.3 }}>
        Something broke on this page
      </h1>
      <p style={{ fontSize: TYPE.body, color: T.textSoft, maxWidth: 460, lineHeight: 1.6 }}>
        The interactive world fell over, which is on me, not on you. The work itself is
        one click away.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
        <a
          href="/resume"
          style={{
            padding: "12px 22px",
            background: T.text,
            color: T.ink,
            fontSize: TYPE.small,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          READ THE RESUME
        </a>
        <a
          href={`mailto:${CONTACT.email}`}
          style={{
            padding: "12px 22px",
            border: `2px solid ${T.text}`,
            color: T.text,
            fontSize: TYPE.small,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          EMAIL ME
        </a>
      </div>
      <a
        href="/"
        style={{ fontSize: TYPE.small, color: T.textMuted, marginTop: 4, textDecoration: "underline" }}
      >
        or start over
      </a>
    </main>
  );
}
