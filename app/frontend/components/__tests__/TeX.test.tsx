import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

vi.mock("../perseus/mathjax-loader", () => ({
  renderTexToSvg: vi.fn(),
}));

vi.mock("../perseus/mathjax-shim", () => ({
  __esModule: true,
  default: null,
}));

import TeX from "../perseus/TeX";
import { renderTexToSvg } from "../perseus/mathjax-loader";

describe("TeX XSS Prevention", () => {
  it("strips HTML tags from TeX input before rendering", async () => {
    (renderTexToSvg as ReturnType<typeof vi.fn>).mockResolvedValue({
      svg: "<svg><text>x</text></svg>",
      accessibleText: "x",
    });

    render(<TeX>{'<script>alert("xss")</script>'}</TeX>);
    await waitFor(() => {
      const call = (renderTexToSvg as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call).toBeTruthy();
      const sanitized = String(call![0]);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
    });
  });

  it("does not execute scripts in generated SVG", async () => {
    const alertMock = vi.fn();
    window.alert = alertMock;

    (renderTexToSvg as ReturnType<typeof vi.fn>).mockResolvedValue({
      svg: '<svg><script>alert("xss")</script><text>x</text></svg>',
      accessibleText: "x",
    });

    render(<TeX>{'x^2'}</TeX>);
    await waitFor(() => {
      expect(alertMock).not.toHaveBeenCalled();
    });
  });

  it("strips script tags from SVG output", async () => {
    (renderTexToSvg as ReturnType<typeof vi.fn>).mockResolvedValue({
      svg: '<svg><script>alert("xss")</script><text>x</text></svg>',
      accessibleText: "x",
    });

    render(<TeX>{'x^2'}</TeX>);
    await waitFor(() => {
      const container = document.querySelector(".tex-mathjax");
      expect(container).toBeTruthy();
      expect(container?.innerHTML).not.toContain("<script>");
    });
  });

  it("strips uppercase script bypass attempts from SVG", async () => {
    (renderTexToSvg as ReturnType<typeof vi.fn>).mockResolvedValue({
      svg: "<svg><SCRIPT>alert('xss')</SCRIPT><text>x</text></svg>",
      accessibleText: "x",
    });

    render(<TeX>{'x^2'}</TeX>);
    await waitFor(() => {
      const container = document.querySelector(".tex-mathjax");
      expect(container?.innerHTML).not.toContain("<SCRIPT>");
    });
  });

  it("handles empty SVG output gracefully", async () => {
    (renderTexToSvg as ReturnType<typeof vi.fn>).mockResolvedValue({
      svg: "",
      accessibleText: "",
    });

    render(<TeX>{''}</TeX>);
    await waitFor(() => {
      const container = document.querySelector(".tex-mathjax");
      expect(container).toBeTruthy();
    });
  });
});
