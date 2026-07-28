// CI dependency gate. Fails only on HIGH/CRITICAL advisories in PRODUCTION
// dependencies, minus a small, documented allowlist. Dev-only tooling
// advisories (eslint / vitest / glob / minimatch chains) never ship to prod and
// are accepted per CLAUDE.md, so we audit with --omit=dev. No extra dependency;
// this replaces a bare `npm audit --audit-level=high` that also flagged dev deps.
import { execSync } from "node:child_process";

// Advisory IDs we knowingly accept, each with a reason.
const ALLOW = new Map([
  // React Router RSC-mode CSRF. This is a client-only SPA that never uses RSC
  // (framework) mode, so it is not exposed. No non-breaking fix exists (the only
  // "fix" is a downgrade into a worse advisory cluster). Revisit when RR ships a
  // patched line in our range.
  ["GHSA-qwww-vcr4-c8h2", "react-router RSC CSRF — SPA does not use RSC mode"],
]);

let audit;
try {
  audit = JSON.parse(execSync("npm audit --omit=dev --json", { encoding: "utf8" }));
} catch (e) {
  // npm audit exits non-zero when advisories exist; the JSON is still on stdout.
  if (!e.stdout) throw e;
  audit = JSON.parse(e.stdout);
}

const offenders = [];
for (const [name, v] of Object.entries(audit.vulnerabilities || {})) {
  if (v.severity !== "high" && v.severity !== "critical") continue;
  // Direct advisories on this package (via entries that are objects with a URL).
  const directIds = (v.via || [])
    .filter((x) => typeof x === "object" && x.url)
    .map((x) => x.url.split("/").pop());
  const unallowed = directIds.filter((id) => !ALLOW.has(id));
  // Entries whose `via` is only string package refs (purely transitive) are
  // covered by whichever direct advisory they point at, which is checked on its
  // own package — so only fail on unallowed DIRECT advisories here.
  if (unallowed.length > 0) offenders.push(`${name} (${v.severity}): ${unallowed.join(", ")}`);
}

if (offenders.length) {
  console.error("Production HIGH/CRITICAL advisories (not allowlisted):");
  offenders.forEach((o) => console.error("  " + o));
  console.error("\nFix them, or add to the allowlist in scripts/check-audit.mjs with a reason.");
  process.exit(1);
}

const accepted = [...ALLOW.entries()].map(([id, why]) => `${id} (${why})`).join("; ");
console.log(`Production audit clean. Accepted: ${accepted || "none"}.`);
