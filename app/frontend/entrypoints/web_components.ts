/**
 * web_components.ts – Islands Architecture bootstrapper (Lazy Loading)
 *
 * This entrypoint:
 *  1. Scans `app/frontend/components/islands/` for files matching
 *     `*-island.tsx` (or `*-island.ts`).
 *  2. For each file it calls `registerIsland(tagName, loader)`, which
 *     registers a native HTML5 Custom Element (Web Component) that:
 *       - Lazily loads the component on first `connectedCallback()`
 *       - Creates a React root inside `connectedCallback()`.
 *       - Parses the element's `data-props` attribute as JSON props.
 *       - Wraps the component in MUI's ThemeProvider.
 *       - Calls `root.unmount()` in `disconnectedCallback()` for clean
 *         Turbo Drive compatibility (no memory leaks on page transitions).
 *
 * MEMORY OPTIMIZATION:
 * Uses lazy loading via `import.meta.glob` without `eager: true`.
 * Islands are only loaded when first encountered in the DOM, reducing
 * initial bundle size and memory usage significantly.
 */

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { workspaceLightTheme } from "./theme";
import { ThemeProviderWrapper } from "../context/ThemeContext";
import type { ComponentType } from "react";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { Toaster } from "react-hot-toast";
import DOMPurify from "dompurify";

// ── HTML Sanitization ────────────────────────────────────────────────────────
const ALLOWED_TAGS = [
  "p", "strong", "em", "ul", "ol", "li", "br", "table", "tr", "td", "th",
  "thead", "tbody", "h1", "h2", "h3", "h4", "h5", "h6", "a", "blockquote",
  "code", "pre",
] as const;

const ALLOWED_ATTR = ["href", "target", "rel"] as const;

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
  });
}

export { sanitizeHtml, ALLOWED_TAGS, ALLOWED_ATTR };

// ── Default MUI theme (override in your own ThemeProvider if desired) ─────────
const defaultTheme = createTheme();

// ── Symbolic constant for the internal React root stored on each element ──────
const REACT_ROOT = Symbol("reactRoot");

// ── Type for island module ───────────────────────────────────────────────────
type IslandModule = {
  default: ComponentType<Record<string, unknown>>;
  tagName: string;
};

// ── Lazy module loader map ───────────────────────────────────────────────────
// This creates a map of file paths to lazy import functions.
// Modules are NOT loaded until explicitly called.
const islandLoaders = import.meta.glob<IslandModule>(
  "../components/islands/*.{ts,tsx}",
  { eager: false }, // LAZY LOAD - modules loaded on demand
);

// ── Reverse lookup: tagName -> loader function ────────────────────────────────
const tagNameToLoader = new Map<string, () => Promise<IslandModule>>();

// Build the reverse lookup map at startup (just mapping, no module loading)
for (const [path, loader] of Object.entries(islandLoaders)) {
  // Extract potential tag name from filename (e.g., "hello-island.tsx" -> "hello-island")
  const filename = path.split("/").pop() ?? "";
  const tagName = filename.replace(/\.(ts|tsx)$/, "");

  if (tagName && tagName.includes("-")) {
    tagNameToLoader.set(tagName, loader as () => Promise<IslandModule>);
    console.debug(`[Islands] Registered lazy loader for <${tagName}>`);
  }
}

/**
 * LazyIslandElement
 *
 * A Custom Element that lazily loads its React component on first mount.
 * This significantly reduces initial memory usage by deferring loading
 * of heavy dependencies (like Perseus) until actually needed.
 */
class LazyIslandElement extends HTMLElement {
  /** React root attached to this element. */
  private [REACT_ROOT]: Root | null = null;

  /** Captured initial child HTML (captured before React mounts). */
  private initialInnerHTML: string | null = null;

  /** The loaded React component (null until loaded). */
  private _component: ComponentType<Record<string, unknown>> | null = null;

  /** Loading state to prevent duplicate loads. */
  private _loading: boolean = false;

  /** Error state. */
  private _error: Error | null = null;

  /** Observed attributes – re-render whenever `data-props` changes. */
  static get observedAttributes(): string[] {
    return ["data-props"];
  }

  /**
   * Get the tag name for this element instance.
   */
  private get islandTagName(): string {
    return this.tagName.toLowerCase();
  }

  /**
   * Parse the `data-props` attribute (JSON string) into a plain object.
   * Falls back to an empty object when the attribute is absent or invalid.
   */
  private parseProps(): Record<string, unknown> {
    const raw = this.getAttribute("data-props");
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      console.warn(
        `[Islands] data-props on <${this.islandTagName}> must be a JSON object.`,
      );
      return {};
    } catch {
      console.error(
        `[Islands] Failed to parse data-props on <${this.islandTagName}>`,
        raw,
      );
      return {};
    }
  }

  /**
   * Lazily load the island module.
   */
  private async loadComponent(): Promise<void> {
    if (this._component || this._loading) return;

    const loader = tagNameToLoader.get(this.islandTagName);
    if (!loader) {
      this._error = new Error(
        `No loader found for <${this.islandTagName}>. ` +
        `Available islands: ${Array.from(tagNameToLoader.keys()).join(", ")}`
      );
      console.error(`[Islands] ${this._error.message}`);
      return;
    }

    this._loading = true;
    try {
      const module = await loader();
      const { default: Component } = module;

      if (!Component) {
        throw new Error(`Module for <${this.islandTagName}> has no default export`);
      }

      this._component = Component;
      this._loading = false;
      console.debug(`[Islands] Lazy loaded <${this.islandTagName}>`);

      // Re-render now that component is loaded
      this.render();
    } catch (err) {
      this._loading = false;
      this._error = err instanceof Error ? err : new Error(String(err));
      console.error(`[Islands] Failed to load <${this.islandTagName}>:`, err);
    }
  }

  /** Mount or re-render the React component. */
  private render(): void {
    if (!this[REACT_ROOT]) return;

    // If still loading, show loading state
    if (this._loading) {
      this[REACT_ROOT].render(
        React.createElement(
          ThemeProvider,
          { theme: workspaceLightTheme || defaultTheme },
          React.createElement(CssBaseline, null),
          React.createElement(
            "div",
            { style: { padding: "1rem", opacity: 0.6 } },
            "Loading..."
          ),
        ),
      );
      return;
    }

    // If error, show error state
    if (this._error) {
      this[REACT_ROOT].render(
        React.createElement(
          ThemeProvider,
          { theme: workspaceLightTheme || defaultTheme },
          React.createElement(CssBaseline, null),
          React.createElement(
            "div",
            { style: { padding: "1rem", color: "red" } },
            `Error loading island: ${this._error.message}`
          ),
        ),
      );
      return;
    }

    // If component not loaded yet, trigger load
    if (!this._component) {
      this.loadComponent();
      return;
    }

    const Component = this._component;
    const props = this.parseProps();

    // If the element had child content prior to React mounting (e.g. server
    // rendered markup placed inside the custom element), capture that HTML
    // and forward it as the component's `children` via a single wrapper
    // node using `dangerouslySetInnerHTML`.
    const childrenHtml = this.initialInnerHTML ?? null;
    const childNode = childrenHtml
      ? React.createElement("div", {
          dangerouslySetInnerHTML: { __html: sanitizeHtml(childrenHtml) },
        })
      : undefined;

    this[REACT_ROOT].render(
      React.createElement(
        ThemeProviderWrapper,
        null,
        React.createElement(
          ThemeProvider,
          { theme: workspaceLightTheme || defaultTheme },
          React.createElement(CssBaseline, null),
          React.createElement(ErrorBoundary, null,
            React.createElement(Component, props, childNode),
          ),
          React.createElement(Toaster, { position: "bottom-left" }),
        ),
      ),
    );
  }

  // ── Custom Element lifecycle ───────────────────────────────────────────────

  connectedCallback(): void {
    // Capture any existing child HTML before React mounts and takes over the
    // element's contents. This allows server-rendered child elements to be
    // forwarded to the React component as `children`.
    if (this.initialInnerHTML === null) {
      this.initialInnerHTML = this.innerHTML;
    }

    // Create the React root the first time this element is inserted into the DOM.
    this[REACT_ROOT] = createRoot(this);

    // Trigger lazy loading
    this.loadComponent();
  }

  disconnectedCallback(): void {
    // Unmount synchronously to release React resources and avoid Turbo Drive leaks.
    this[REACT_ROOT]?.unmount();
    this[REACT_ROOT] = null;
    // Clear captured HTML to avoid retaining references across navigations.
    this.initialInnerHTML = null;
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue !== newValue) {
      this.render();
    }
  }
}

/**
 * registerLazyIsland
 *
 * Utility to define a Custom Element with lazy loading.
 * The component is NOT loaded until the element is first inserted into the DOM.
 *
 * @param tagName   Hyphenated element name, e.g. "hello-island".
 */
function registerLazyIsland(tagName: string): void {
  if (customElements.get(tagName)) {
    // Already registered – skip (handles HMR re-evaluation)
    return;
  }

  // Create a unique subclass for each tag to avoid constructor sharing.
  const IslandClass = class extends LazyIslandElement {
    // The base class already implements all behavior; we only need a distinct
    // constructor reference so the CustomElementRegistry treats each tag as a
    // separate definition.
    constructor() {
      super();
    }
  };

  customElements.define(tagName, IslandClass);
  console.debug(`[Islands] Registered lazy <${tagName}>`);
}

// ── Register all islands for lazy loading ─────────────────────────────────────
// Vite's `import.meta.glob` with `eager: false` creates a map of lazy loaders.
// We register custom elements for each island, but the actual modules are only
// loaded when the element is first encountered in the DOM.
// Convention: each file exports its React component as the **default** export
// and its Custom Element tag name as a named export `tagName`.
// Example (hello-island.tsx):
//   export const tagName = "hello-island";
//   export default function HelloIsland(props) { … }

for (const tagName of tagNameToLoader.keys()) {
  registerLazyIsland(tagName);
}

console.info(
  `[Islands] Initialized lazy loading for ${tagNameToLoader.size} islands:`,
  Array.from(tagNameToLoader.keys()).join(", ")
);
