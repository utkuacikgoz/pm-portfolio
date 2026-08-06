import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['coverage', 'dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Pinned to plugin v5 on purpose. v7 ships the React Compiler rules
      // (refs / immutability / purity / set-state-in-effect) which flag 22 sites
      // here, nearly all idiomatic: mutating scene.fog and refs inside useFrame
      // is how react-three-fiber is meant to be written, and the rest are the
      // latest-ref pattern and state resets keyed to a route change. Adopting v7
      // means refactoring the 3D layer, which needs eyes on a browser. Until
      // then v5 gives the rules that actually catch bugs (rules-of-hooks,
      // exhaustive-deps). See docs/dependency-audit.md.
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
