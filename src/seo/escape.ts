/**
 * HTML escaping for the build-time prerenderer (`scripts/vite-seo.ts`).
 *
 * Lives here, in the app's own project, rather than inside the plugin, for one
 * practical reason: the plugin is a node-context module (`node:fs`, `vite`), so
 * importing it from a test would drag node types into `tsconfig.app.json`. The
 * escaping is pure string work and is the highest-risk code in the SEO path, so
 * it belongs where it can be tested cheaply.
 */

/** Escape a value being interpolated into HTML text or an attribute. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Serialize JSON-LD for embedding in a `<script type="application/ld+json">`.
 *
 * `JSON.stringify` escapes neither `<` nor `/`, so a registry string containing
 * `</script>` closes the element and everything after it is parsed as markup.
 * Every other slot in the prerenderer goes through `escapeHtml`; this one cannot,
 * because the contents have to stay valid JSON. Escaping `<` as `<`
 * satisfies both: JSON parsers read it back as `<`, and the HTML tokenizer never
 * sees a tag.
 */
export const jsonLdScript = (jsonLd: unknown): string =>
  JSON.stringify(jsonLd).replace(/</g, "\\u003c");
