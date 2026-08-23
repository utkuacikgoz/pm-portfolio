declare module "virtual:seo-meta" {
  /**
   * Per-route <head> metadata, generated at build time by
   * `scripts/vite-seo-meta.ts`. Keyed by route path ("/", "/resume", "/p/:id").
   */
  const meta: Record<string, { title: string; description: string; jsonLd: unknown[] }>;
  export default meta;
}
