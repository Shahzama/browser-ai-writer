import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest globals are off, so Testing Library cannot clean up on its own.
// Without this, components from earlier tests stay in the DOM.
afterEach(() => {
  cleanup();
});
