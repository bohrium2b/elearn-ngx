/**
 * web_components.ts – Islands Architecture bootstrapper
 *
 * This entrypoint:
 *  1. Scans `app/frontend/components/islands/` for files matching
 *     `*-island.tsx` (or `*-island.ts`).
 *  2. For each file it calls `registerIsland(tagName, Component)`, which
 *     registers a native HTML5 Custom Element (Web Component) that:
 *       - Creates a React root inside `connectedCallback()`.
 *       - Parses the element's `data-props` attribute as JSON props.
 *       - Wraps the component in MUI's ThemeProvider.
 *       - Calls `root.unmount()` in `disconnectedCallback()` for clean
 *         Turbo Drive compatibility (no memory leaks on page transitions).
 */

import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { theme } from "./theme"; // Import the MUI theme from the entrypoints directory
import type { ComponentType } from "react";

// ── Default MUI theme (override in your own ThemeProvider if desired) ─────────
const defaultTheme = createTheme();

// ── Symbolic constant for the internal React root stored on each element ──────
const REACT_ROOT = Symbol("reactRoot");

/**
 * BaseIslandElement
 *
 * A generic Custom Element base class that mounts any React component
 * and pipes the element's `data-props` JSON attribute into it as props.
 *
 * Subclasses only need to override `component` to return their TSX component.
 */
abstract class BaseIslandElement extends HTMLElement {
  /** React root attached to this element. */
  private [REACT_ROOT]: Root | null = null;

  /** Captured initial child HTML (captured before React mounts). */
  private initialInnerHTML: string | null = null;

  /** Override in subclasses to provide the React component to render. */
  protected abstract get component(): ComponentType<Record<string, unknown>>;

  /** Observed attributes – re-render whenever `data-props` changes. */
  static get observedAttributes(): string[] {
    return ["data-props"];
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
        `[Islands] data-props on <${this.tagName.toLowerCase()}> must be a JSON object.`,
      );
      return {};
    } catch {
      console.error(
        `[Islands] Failed to parse data-props on <${this.tagName.toLowerCase()}>`,
        raw,
      );
      return {};
    }
  }

  /** Mount or re-render the React component. */
  private render(): void {
    if (!this[REACT_ROOT]) return;

    const Component = this.component;
    const props = this.parseProps();

    // If the element had child content prior to React mounting (e.g. server
    // rendered markup placed inside the custom element), capture that HTML
    // and forward it as the component's `children` via a single wrapper
    // node using `dangerouslySetInnerHTML`.
    const childrenHtml = this.initialInnerHTML ?? null;
    const childNode = childrenHtml
      ? React.createElement("div", {
          dangerouslySetInnerHTML: { __html: childrenHtml },
        })
      : undefined;

    this[REACT_ROOT].render(
      React.createElement(
        ThemeProvider,
        { theme: theme || defaultTheme },
        React.createElement(CssBaseline, null),
        React.createElement(Component, props, childNode),
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
    this.render();
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
 * registerIsland
 *
 * Utility to define a Custom Element from a React component.
 *
 * @param tagName   Hyphenated element name, e.g. "hello-island".
 * @param Component The React component to mount inside the custom element.
 */
function registerIsland(
  tagName: string,
  Component: ComponentType<Record<string, unknown>>,
): void {
  if (customElements.get(tagName)) {
    // Already registered – skip (handles HMR re-evaluation)
    return;
  }

  const IslandElement = class extends BaseIslandElement {
    protected get component(): ComponentType<Record<string, unknown>> {
      return Component;
    }
  };

  customElements.define(tagName, IslandElement);
  console.debug(`[Islands] Registered <${tagName}>`);
}

// ── Auto-discovery: scan islands/ directory ───────────────────────────────────
//
// Vite's `import.meta.glob` is evaluated at build-time and resolved into a
// static map of `{ [filePath]: () => Promise<module> }`.
//
// Convention: each file exports its React component as the **default** export
// and its Custom Element tag name as a named export `tagName`.
//
// Example (hello-island.tsx):
//   export const tagName = "hello-island";
//   export default function HelloIsland(props) { … }

type IslandModule = {
  default: ComponentType<Record<string, unknown>>;
  tagName: string;
};

const islandModules = import.meta.glob<IslandModule>(
  "../components/islands/*.{ts,tsx}",
  { eager: true },
);

for (const [path, module] of Object.entries(islandModules)) {
  const { default: Component, tagName } = module;

  if (!Component) {
    console.warn(`[Islands] ${path} has no default export – skipping.`);
    continue;
  }
  if (!tagName || !tagName.includes("-")) {
    console.warn(
      `[Islands] ${path} must export a 'tagName' string containing a hyphen – skipping.`,
    );
    continue;
  }

  registerIsland(tagName, Component);
}
