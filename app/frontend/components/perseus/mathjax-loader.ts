import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { CHTML } from "mathjax-full/js/output/chtml.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import type { LiteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";

export type MathJaxAdaptor = LiteAdaptor;
export type MathJaxDocument = ReturnType<typeof mathjax.document>;

// SRE module type
interface SreModule {
  setupEngine: (options: { locale: string; modality: string }) => Promise<void>;
  engineReady: () => Promise<void>;
  toSpeech: (mml: string) => string;
}

let initialized = false;
let adaptor: MathJaxAdaptor | null = null;
let svgDoc: MathJaxDocument | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let chtmlDoc: MathJaxDocument | null = null;

// MathJax v4 startup bundle type
interface MathJaxStartupBundle {
  startup?: {
    promise?: Promise<void>;
    adaptor?: MathJaxAdaptor;
  };
  tex2svgPromise?: (
    tex: string,
    options: { display: boolean },
  ) => Promise<unknown>;
  tex2mmlPromise?: (
    tex: string,
    options: { display: boolean },
  ) => Promise<string>;
  loader?: {
    paths?: { mathjax?: string };
  };
}

let startupMathJax: MathJaxStartupBundle | null = null;

async function init(): Promise<void> {
  console.log("Initializing MathJax...");
  if (initialized) {
    console.log("MathJax already initialized.");
    return;
  }

  const globalMathJax = (
    globalThis as unknown as { MathJax?: MathJaxStartupBundle }
  ).MathJax;

  if (globalMathJax?.startup) {
    startupMathJax = globalMathJax;
    if (startupMathJax.startup?.promise) {
      await startupMathJax.startup.promise;
    }
  } else {
    try {
      await import("@mathjax/src/bundle/tex-svg.js");
      startupMathJax =
        (globalThis as unknown as { MathJax?: MathJaxStartupBundle }).MathJax ??
        null;
      if (startupMathJax?.startup?.promise) {
        await startupMathJax.startup.promise;
      }
    } catch {
      console.log("Failed to load MathJax v4 bundle");
    }
  }

  adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);

  const tex = new TeX({ packages: ["base", "ams"] });
  const svg = new SVG({ fontCache: "local" });
  const chtml = new CHTML();

  svgDoc = mathjax.document("", { InputJax: tex, OutputJax: svg });
  chtmlDoc = mathjax.document("", { InputJax: tex, OutputJax: chtml });

  initialized = true;
}

function stripTags(html: string): string {
  // Rudimentary tag stripper — good enough for short MathML fragments.
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MATHJAX_RENDER_TIMEOUT_MS = 10;

export async function renderTexToSvg(
  texSource: string,
): Promise<{ svg: string; accessibleText: string }> {
  await init();
  console.log("Loc A: Rendering TeX to SVG inside mathjax-loader:", texSource);
  let accessibleText = texSource;
  console.log("Loc B: Generated accessible text (fallback):", accessibleText);
  if (startupMathJax?.tex2svgPromise) {
    console.log("Loc C: Using startup bundle for TeX rendering.");
    try {
      const node = await Promise.race([
        startupMathJax.tex2svgPromise(texSource, {
          display: false,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `MathJax tex2svgPromise timed out after ${MATHJAX_RENDER_TIMEOUT_MS}ms`,
                ),
              ),
            MATHJAX_RENDER_TIMEOUT_MS,
          ),
        ),
      ]);
      console.log("Loc D: Generated node (startup bundle):", node);
      const startupAdaptor = startupMathJax.startup?.adaptor;
      if (startupAdaptor) {
        // Prefer adaptor.innerHTML to capture the entire serialized output
        // (handles cases where MathJax produces multiple sibling nodes).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let svg = startupAdaptor.innerHTML(node as any);
        if (!svg) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const svgEl = startupAdaptor.tags(node as any, "svg")[0];
          if (svgEl) {
            svg = startupAdaptor.serializeXML(svgEl);
          }
        }

        if (typeof startupMathJax.tex2mmlPromise === "function") {
          const mml = await startupMathJax.tex2mmlPromise(texSource, {
            display: false,
          });
          accessibleText = stripTags(mml) || texSource;

          // Try to generate a speech string from MathML using SRE. First
          // attempt to import the npm package; if absent, try the
          // bundled copy under the configured MathJax path (e.g. /mathjax).
          try {
            let sreModule: SreModule | null = null;
            try {
              // Preferred: installed package
              const imported =
                await import("speech-rule-engine/js/common/system.js");
              sreModule = imported as unknown as SreModule;
            } catch {
              // Fallback: bundled copy under the MathJax loader path
              const base = startupMathJax?.loader?.paths?.mathjax || "/mathjax";
              const imported = await import(
                `${base}/sre/speech-rule-engine.js`
              );
              sreModule = imported as unknown as SreModule;
            }

            if (sreModule) {
              const { setupEngine, engineReady, toSpeech } = sreModule;
              // Default to English speech modality; could be parameterized.
              await setupEngine({ locale: "en", modality: "speech" });
              await engineReady();
              // toSpeech expects MathML string or a serialized MathML node.
              const speech = toSpeech(mml);
              if (speech) accessibleText = speech;
            }
          } catch {
            // SRE unavailable or failed — fall back to MathML text.
            console.debug("SRE not available for speech generation");
          }
        }

        console.log("Loc D1: Generated SVG (startup bundle):", svg);
        console.log(
          "Generated accessible text (startup bundle):",
          accessibleText,
        );
        return { svg, accessibleText };
      }
      console.log("Failed to generate node (startup bundle).");
    } catch (err) {
      console.log("Error occurred while rendering TeX with startup bundle.");
      console.error("MathJax startup render error:", err);
      // Fall through to module-based rendering.
    }
    console.log("Loc E: Failed to use startup bundle for TeX rendering.");
  }

  console.log(
    "Using module-based rendering for TeX - failed to use startup bundle",
  );
  // Module-based fallback (mathjax-full / component API).
  if (svgDoc && adaptor) {
    const svgNode = svgDoc.convert(texSource, { display: false });
    const svg = adaptor.innerHTML(svgNode);

    // Use speech rule engine to generate accessible text
    // (works in only v4 with the a11y extension, not in v3).

    console.log("Generated SVG (module):", svg);
    console.log("Generated accessible text (from CHTML):", accessibleText);
    return { svg, accessibleText };
  }

  // Final fallback
  return { svg: "", accessibleText: texSource };
}

export default { renderTexToSvg };
