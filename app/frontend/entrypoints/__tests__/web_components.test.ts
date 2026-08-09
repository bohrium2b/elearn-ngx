import { describe, it, expect } from "vitest";
import { sanitizeHtml, ALLOWED_TAGS, ALLOWED_ATTR } from "../web_components";

describe("sanitizeHtml (DOMPurify)", () => {
  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).not.toContain("alert");
  });

  it("strips iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<iframe");
  });

  it("strips inline event handlers", () => {
    const input = '<div onclick="alert(1)">click</div>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("onclick");
  });

  it("strips javascript: URLs in href", () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("javascript:");
  });

  it("strips javascript: URLs in src", () => {
    const input = '<img src="javascript:alert(1)">';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("javascript:");
  });

  it("preserves allowed tags", () => {
    const input = "<p><strong>bold</strong> <em>italic</em></p>";
    const output = sanitizeHtml(input);
    expect(output).toContain("<p>");
    expect(output).toContain("<strong>");
    expect(output).toContain("<em>");
    expect(output).toContain("</p>");
  });

  it("strips uppercase bypass attempts", () => {
    const input = "<SCRIPT>alert('xss')</SCRIPT>";
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<SCRIPT>");
    expect(output).not.toContain("alert");
  });

  it("strips SVG event handlers", () => {
    const input =
      '<svg onload="alert(1)"><circle r="10"></circle></svg>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("onload");
    expect(output).not.toContain("<svg");
  });

  it("strips object and embed tags", () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<object");
    expect(output).not.toContain("<embed");
  });

  it("strips non-allowed tags while preserving content", () => {
    const input = "<div>Keep <span>this</span> text</div>";
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<div");
    expect(output).not.toContain("<span");
    expect(output).toContain("Keep");
    expect(output).toContain("this");
    expect(output).toContain("text");
  });

  it("allows href on a tags but not on other tags", () => {
    const input = '<a href="https://example.com">link</a><div href="javascript:alert(1)">div</div>';
    const output = sanitizeHtml(input);
    expect(output).toContain('href="https://example.com"');
    expect(output).not.toContain("javascript:");
  });

  it("handles empty strings", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("handles plain text without HTML", () => {
    const input = "Just plain text";
    expect(sanitizeHtml(input)).toBe("Just plain text");
  });

  it("strips nested script inside allowed structures", () => {
    const input = "<table><tr><td><script>alert(1)</script></td></tr></table>";
    const output = sanitizeHtml(input);
    expect(output).not.toContain("<script>");
    expect(output).toContain("<table>");
  });
});

describe("ALLOWED_TAGS and ALLOWED_ATTR", () => {
  it("defines a non-empty allowlist for tags", () => {
    expect(ALLOWED_TAGS.length).toBeGreaterThan(0);
    expect(ALLOWED_TAGS).not.toContain("script");
    expect(ALLOWED_TAGS).not.toContain("iframe");
  });

  it("defines a non-empty allowlist for attributes", () => {
    expect(ALLOWED_ATTR.length).toBeGreaterThan(0);
    expect(ALLOWED_ATTR).not.toContain("onclick");
    expect(ALLOWED_ATTR).not.toContain("onload");
  });
});
