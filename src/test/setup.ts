// Extends Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
// for any component/DOM tests. Pure-logic tests don't need it, but it's cheap
// to have available globally.
import "@testing-library/jest-dom";
