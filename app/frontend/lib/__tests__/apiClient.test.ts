import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "../apiError";
import { getCsrfToken } from "../getCsrfToken";

describe("getCsrfToken", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("returns the csrf-token meta content when present", () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "abc123";
    document.head.appendChild(meta);

    expect(getCsrfToken()).toBe("abc123");
  });

  it("returns empty string when csrf-token meta is absent", () => {
    expect(getCsrfToken()).toBe("");
  });
});

describe("ApiError", () => {
  it("creates an error with message, status, and body", () => {
    const error = new ApiError("Not found", 404, { error: "missing" });
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
    expect(error.body).toEqual({ error: "missing" });
    expect(error.name).toBe("ApiError");
  });

  it("is an instance of Error", () => {
    const error = new ApiError("fail", 500, null);
    expect(error).toBeInstanceOf(Error);
  });
});

describe("apiRequest", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "token123";
    document.head.appendChild(meta);

    const mockData = { id: 1, name: "Test" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { apiRequest } = await import("../apiClient");
    const result = await apiRequest<{ id: number; name: string }>("/test");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith("/test", {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "token123",
        Accept: "application/json",
      },
    });
  });

  it("throws ApiError on non-ok response with JSON body", async () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "token123";
    document.head.appendChild(meta);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      json: () => Promise.resolve({ message: "Validation failed" }),
    } as Response);

    const { apiRequest } = await import("../apiClient");
    await expect(apiRequest("/test")).rejects.toThrow(ApiError);
    await expect(apiRequest("/test")).rejects.toMatchObject({
      message: "Validation failed",
      status: 422,
    });
  });

  it("throws ApiError on non-ok response with error field", async () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "token123";
    document.head.appendChild(meta);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ error: "Something broke" }),
    } as Response);

    const { apiRequest } = await import("../apiClient");
    await expect(apiRequest("/test")).rejects.toMatchObject({
      message: "Something broke",
      status: 500,
    });
  });

  it("falls back to status text when JSON parse fails", async () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "token123";
    document.head.appendChild(meta);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as Response);

    const { apiRequest } = await import("../apiClient");
    await expect(apiRequest("/test")).rejects.toMatchObject({
      message: "Bad Gateway",
      status: 502,
    });
  });

  it("passes through custom headers and body", async () => {
    const meta = document.createElement("meta");
    meta.name = "csrf-token";
    meta.content = "token123";
    document.head.appendChild(meta);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    const { apiRequest } = await import("../apiClient");
    await apiRequest("/test", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
      headers: { "X-Custom": "value" },
    });

    expect(fetch).toHaveBeenCalledWith("/test", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "token123",
        Accept: "application/json",
        "X-Custom": "value",
      },
    });
  });
});
