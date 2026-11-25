import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnsupportedBanner } from "./UnsupportedBanner";

describe("UnsupportedBanner", () => {
  it("explains the problem and shows the demo instead of a dead end", () => {
    render(<UnsupportedBanner reason="This browser does not support WebGPU." />);
    expect(screen.getByRole("heading", { name: /can't run the AI model/i })).toBeInTheDocument();
    expect(screen.getByText("This browser does not support WebGPU.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /demo/i })).toHaveAttribute("src", "/demo.gif");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/Shahzama/browser-ai-writer",
    );
  });
});
