import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { seo } from "./scripts/vite-seo";

// PostHog is called through a first-party /ingest path so ad blockers do not
// eat the events (see src/analytics/config.ts). Vercel rewrites it in prod;
// this proxy is the same trick for `npm run dev`.
const POSTHOG_INGEST = {
  "/ingest/static": {
    target: "https://us-assets.i.posthog.com",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/ingest\/static/, "/static"),
  },
  "/ingest": {
    target: "https://us.i.posthog.com",
    changeOrigin: true,
    rewrite: (p: string) => p.replace(/^\/ingest/, ""),
  },
};

export default defineConfig({
  plugins: [react(), seo()],
  base: "/",
  server: { proxy: POSTHOG_INGEST },
  preview: { proxy: POSTHOG_INGEST },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep three.js off the critical path. The object form of manualChunks
        // looked like it did this, but it silently did the opposite: naming
        // "three" as a chunk turns it into a chunk entry, and Rollup hoisted
        // every module shared with the real entry into it — react, react-dom
        // and, fatally, vite/preload-helper. That made the entry chunk import
        // the three chunk STATICALLY, so index.html modulepreloaded 1 MB of
        // WebGL engine for every visitor, including the mobile flat path that
        // never renders a triangle.
        //
        // The function form lets us claim those shared modules first, so the
        // three chunk is reachable only through import("./World").
        // Verify after changing this: dist/index.html must NOT modulepreload
        // the three chunk, and `head -c 200 dist/assets/index-*.js` must not
        // import from it.
        manualChunks(id) {
          if (id.includes("vite/preload-helper")) return "react";
          if (/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//.test(id)) {
            return "react";
          }
          if (id.includes("node_modules/three/") || id.includes("node_modules/@react-three/")) {
            return "three";
          }
          if (id.includes("node_modules/posthog-js/") || id.includes("node_modules/@posthog/")) {
            return "posthog";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      // Coverage is gated on the pure, deterministic logic layer (registry +
      // geometry + content). The WebGL rendering path (one <Canvas>, r3f
      // components) is verified by the build + manual QA, not unit tests — the
      // same "floor on testable logic" stance the Python repos take.
      include: [
        "src/world/geometry.ts",
        "src/projects/**",
        "src/content/**",
        "src/analytics/attribution.ts",
        "src/seo/routes.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
