import { describe, expect, it } from "vitest";
import { escapeHtml, jsonLdScript } from "./escape";

// The prerenderer is the only place in this codebase that builds HTML by string
// concatenation, so it is the only place an escaping slip becomes stored XSS.
// It runs at BUILD time over registry content, so an attacker needs a bad string
// to reach `src/projects/projects.ts` or `src/content/*.ts` first. That is not
// far-fetched: "add a content file + a registry row" is the documented way to
// extend this app, so content is not a trust boundary.
const BREAKOUT = "</script><img src=x onerror=alert(1)>";

describe("prerender escaping", () => {
  it("escapes the characters that end an HTML text or attribute context", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });

  it("escapes the ampersand first, so nothing is double-decoded", () => {
    // Order matters: replacing < before & would turn "&lt;" into "&amp;lt;".
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("never lets registry content close the JSON-LD script element", () => {
    // Regression: JSON.stringify escapes neither `<` nor `/`, so a title
    // containing "</script>" closed the block and everything after it parsed as
    // markup, in all 7 prerendered files. CSP is Report-Only, so an injected
    // onerror= would actually have executed.
    const out = jsonLdScript([{ "@type": "Thing", name: `BiLira${BREAKOUT}` }]);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("\\u003c");
  });

  it("round-trips the payload as data, so escaping never corrupts the JSON-LD", () => {
    const value = { "@type": "Thing", name: `BiLira${BREAKOUT}`, note: "a < b" };
    expect(JSON.parse(jsonLdScript(value))).toEqual(value);
  });

  it("leaves ordinary structured data byte-identical to JSON.stringify", () => {
    const plain = { "@context": "https://schema.org", name: "Utku Acikgoz" };
    expect(jsonLdScript(plain)).toBe(JSON.stringify(plain));
  });
});
