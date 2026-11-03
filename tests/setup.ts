import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
afterEach(() => cleanup());

// No browser extension exists under jsdom: by default Freighter is "not installed". Tests that
// exercise the Freighter adapter inject their own stand-in (tests/freighter.test.ts).
vi.mock("@stellar/freighter-api", () => ({
  default: { isConnected: async () => ({ isConnected: false }) },
}));
