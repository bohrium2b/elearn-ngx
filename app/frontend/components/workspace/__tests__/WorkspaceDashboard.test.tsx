import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import WorkspaceDashboard from "../WorkspaceDashboard";

const theme = createTheme();

const mockTag = {
  id: 1,
  uuid: "tag-1",
  slug: "algebra",
  name: "Algebra",
  color: "#ff0000",
  permalink: "/tags/1",
  questions: [],
  subtags: [],
};

const mockQuestion = {
  id: 1,
  uuid: "q-1",
  slug: "what-is-2-plus-2",
  code: null,
  label: "What is 2+2?",
  question: "What is 2+2?",
  choices: [{ content: "3", correct: false }, { content: "4", correct: true }],
  hints: [],
  numChoices: 1,
  showPath: "/questions/1",
  updatePath: "/questions/1",
  source_tag_id: null,
};

const baseProps = {
  treeData: [mockTag],
  untaggedQuestions: [mockQuestion],
  refreshPath: "/workspace.json",
  classifyPath: "/classify",
  csrfToken: "test-token",
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("WorkspaceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          treeData: [mockTag],
          untaggedQuestions: [mockQuestion],
        }),
      headers: new Headers({ etag: '"abc123"' }),
    } as Response);
  });

  it("renders tag tree and questions", () => {
    renderWithTheme(<WorkspaceDashboard {...baseProps} />);
    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("opens create tag dialog when New tag is clicked", async () => {
    renderWithTheme(<WorkspaceDashboard {...baseProps} />);

    fireEvent.click(screen.getByText("New"));
    fireEvent.click(screen.getByText("New tag"));

    await waitFor(() => {
      expect(screen.getByText("Create Tag")).toBeInTheDocument();
    });
  });

  it("creates a tag and refreshes workspace", async () => {
    let capturedBody = "";
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (typeof options?.body === "string") {
        capturedBody = options.body;
      }
      return {
        ok: true,
        json: () =>
          Promise.resolve({
            treeData: [mockTag],
            untaggedQuestions: [mockQuestion],
          }),
        headers: new Headers({ etag: '"new-etag"' }),
      } as Response;
    });

    renderWithTheme(<WorkspaceDashboard {...baseProps} />);

    fireEvent.click(screen.getByText("New"));
    fireEvent.click(screen.getByText("New tag"));

    await waitFor(() => {
      expect(screen.getByText("Create Tag")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New Tag" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(capturedBody).toContain("New Tag");
    });
  });

  it("selects a question and shows detail panel", async () => {
    renderWithTheme(<WorkspaceDashboard {...baseProps} />);

    fireEvent.click(screen.getByText("What is 2+2?"));

    await waitFor(() => {
      expect(screen.getByText("what-is-2-plus-2")).toBeInTheDocument();
    });
  });

  it("deletes a tag via confirmation dialog", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url === "/tags/1") {
        return { ok: true } as Response;
      }
      return {
        ok: true,
        json: () =>
          Promise.resolve({
            treeData: [mockTag],
            untaggedQuestions: [mockQuestion],
          }),
        headers: new Headers({ etag: '"new-etag"' }),
      } as Response;
    });

    renderWithTheme(<WorkspaceDashboard {...baseProps} />);

    fireEvent.click(screen.getByText("Edit"));

    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(screen.getByText("Are you sure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/tags/1", {
        method: "DELETE",
        headers: { "X-CSRF-Token": "test-token" },
      });
    });
  });
});
