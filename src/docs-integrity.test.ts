import { describe, expect, it } from "vitest";

/**
 * Guardrail against documentation drift.
 *
 * Two markdown files at the repo root sat for seven months describing
 * `src/components/NarrativeScene.tsx` and `src/components/MetricsVisualization.tsx`
 * after both were deleted, and `src/components/` with them. Nothing failed,
 * because prose is not compiled. A doc that confidently describes code that does
 * not exist is worse than no doc: the next session trusts it and builds on a lie.
 *
 * These checks are deliberately mechanical. They cannot tell whether an
 * explanation is still TRUE, only whether the things it points at still EXIST,
 * which is the failure mode that actually happened and the one a human reviewer
 * is least likely to catch by reading.
 *
 * import.meta.glob rather than node:fs, matching `theme.test.ts`, so this stays
 * inside the app's browser-typed project and needs no node types.
 */
const markdown = import.meta.glob("/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Keys only (not eager), so this is a cheap file listing rather than a read of
// every asset in the repo.
const repoFiles = new Set(
  Object.keys(
    import.meta.glob("/{src,scripts,docs,public,.github,.claude}/**/*", { eager: false })
  )
);
for (const key of Object.keys(markdown)) repoFiles.add(key);
// import.meta.glob never returns the module doing the globbing, so this file has
// to add itself or CLAUDE.md's reference to it reads as a broken path.
repoFiles.add("/src/docs-integrity.test.ts");
for (const root of ["/package.json", "/vercel.json", "/index.html", "/vite.config.ts", "/eslint.config.js"]) {
  repoFiles.add(root);
}

const scripts = Object.keys(
  (JSON.parse(
    (import.meta.glob("/package.json", { query: "?raw", import: "default", eager: true }) as Record<string, string>)[
      "/package.json"
    ]
  ) as { scripts: Record<string, string> }).scripts
);

const docs = Object.entries(markdown).filter(([path]) => !path.includes("/node_modules/"));

/** Resolve a link relative to the doc containing it, into a repo-absolute path. */
function resolveFrom(docPath: string, target: string): string {
  const segments = docPath.split("/").slice(0, -1).concat(target.split("/"));
  const out: string[] = [];
  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") out.pop();
    else out.push(segment);
  }
  return "/" + out.join("/");
}

describe("documentation integrity", () => {
  it("finds markdown files to check", () => {
    // Guards the guard: a glob that silently matches nothing would make every
    // assertion below vacuously true.
    expect(docs.length).toBeGreaterThan(5);
  });

  it("has no broken internal links", () => {
    const broken: string[] = [];
    for (const [docPath, source] of docs) {
      for (const match of source.matchAll(/\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
        const target = match[1];
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const resolved = resolveFrom(docPath, target);
        if (!repoFiles.has(resolved) && !repoFiles.has(resolved.replace(/\/$/, ""))) {
          broken.push(`${docPath} -> ${target}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("only points at source files that exist", () => {
    // Backticked paths like `src/world/geometry.ts`.
    //
    // The convention this enforces: BACKTICKS AROUND A PATH MEAN IT IS LIVE. A
    // file that has been deleted can still be discussed in prose, but it is
    // written as plain text, not formatted as though you could go and open it.
    // That keeps the check strict with no exemption list, which would otherwise
    // become the place drift hides.
    //
    // Wildcards are skipped: docs legitimately write `src/content/*.ts` to mean a
    // family of files.
    const missing: string[] = [];
    for (const [docPath, source] of docs) {
      for (const match of source.matchAll(/`([^`\s]+\.(?:tsx?|jsx?|css|json|mjs|html|yml|pdf|woff2))`/g)) {
        const target = match[1];
        if (target.includes("*") || target.startsWith("http")) continue;
        if (!/^(src|scripts|docs|public|\.github|\.claude)\//.test(target)) continue;
        if (!repoFiles.has("/" + target)) missing.push(`${docPath} -> ${target}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("only documents npm scripts that exist", () => {
    const unknown: string[] = [];
    for (const [docPath, source] of docs) {
      for (const match of source.matchAll(/npm run ([a-z][\w:-]*)/g)) {
        if (!scripts.includes(match[1])) unknown.push(`${docPath} -> npm run ${match[1]}`);
      }
    }
    expect(unknown).toEqual([]);
  });
});
