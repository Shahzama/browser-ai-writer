import { describe, expect, it } from "vitest";
import { formatProgress } from "./progress";

describe("formatProgress", () => {
  it("shortens WebLLM download messages", () => {
    expect(
      formatProgress(
        0.07,
        "Fetching param cache[3/22]: 48MB fetched. 7% completed, 1 secs elapsed. It can take a while when we first visit this page to populate the cache.",
      ),
    ).toBe("Downloading model · 48 MB · 7%");
  });

  it("shows cache loads differently from downloads", () => {
    expect(formatProgress(0.5, "Loading model from cache[11/22]: 350MB loaded. 50% completed")).toBe(
      "Loading from browser cache · 50%",
    );
  });

  it("handles the GPU setup step", () => {
    expect(formatProgress(1, "Loading GPU shader modules[10/52]")).toBe("Preparing your GPU…");
  });

  it("keeps the percent between 0 and 100", () => {
    expect(formatProgress(1.4, "Fetching param cache")).toBe("Downloading model · 100%");
  });

  it("handles an empty message", () => {
    expect(formatProgress(0, "")).toBe("Starting…");
  });
});
