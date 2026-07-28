import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split three.js + r3f/drei into their own vendor chunk so the lazy
        // <World> route is the only thing that pulls them. The flat/mobile
        // fallback never imports World, so this chunk never loads there.
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
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
