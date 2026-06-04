/**
 * application.ts – Primary Vite entrypoint
 *
 * This file is loaded on every page via the application layout.
 * Keep it lightweight: import Turbo, Stimulus controllers, and global CSS here.
 */

// ── Turbo Drive (SPA-like navigation without a full page reload) ──────────────
import "@hotwired/turbo-rails";

// ── Stimulus (lightweight controllers for sprinkled interactivity) ─────────────
import { Application } from "@hotwired/stimulus";
import { registerControllers } from "stimulus-vite-helpers";

const stimulusApp = Application.start();
// Auto-load all controllers in app/frontend/controllers/**/*_controller.ts
const controllers = import.meta.glob<{ default: unknown }>(
  "../controllers/**/*_controller.ts",
  { eager: true },
);
registerControllers(stimulusApp, controllers);

// ── Global CSS (optional) ───────────────────────────────────────────────────────

import "bootstrap/dist/css/bootstrap.min.css";
// import "@/styles/application.css";

// Polyfill for libraries that expect `jQuery.event.props` to exist (Perseus
// and some jQuery-mobile helpers assume this array). Newer jQuery versions
// (v4+) removed this internal property which can cause `undefined.concat` errors.
import $ from "jquery";
if (!$.event) {
  // Ensure the event object exists
  // @ts-expect-error - adding a non-standard property for compatibility
  $.event = {} as any;
}
// @ts-expect-error - jQuery internal API compatibility shim
$.event.props = $.event.props || [];
