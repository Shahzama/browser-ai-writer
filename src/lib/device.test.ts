import { afterEach, describe, expect, it, vi } from "vitest";
import { isTouchDevice, prefersSmallModel } from "./device";

function mockPointer(coarse: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: coarse && query.includes("coarse") }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("device helpers", () => {
  it("detects touch screens", () => {
    mockPointer(true);
    expect(isTouchDevice()).toBe(true);
    expect(prefersSmallModel()).toBe(true);
  });

  it("treats a mouse-driven computer as not touch", () => {
    mockPointer(false);
    expect(isTouchDevice()).toBe(false);
  });

  it("does not crash when matchMedia is missing", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(isTouchDevice()).toBe(false);
  });
});
