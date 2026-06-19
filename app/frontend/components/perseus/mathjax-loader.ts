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
  if (initialized) return;

  // 1) Prefer an already-loaded global MathJax startup bundle (v4).
  const globalMathJax = (
    globalThis as unknown as { MathJax?: MathJaxStartupBundle }
  ).MathJax;
  if (globalMathJax?.startup) {
    startupMathJax = globalMathJax;
    if (startupMathJax.startup?.promise) {
      await startupMathJax.startup.promise;
    }
    initialized = true;
    return;
  }

  // 2) Try to load a v4 combined bundle if available (e.g. @mathjax/src).
  try {
    // This dynamic import may fail if the bundle/package isn't installed.
    await import("@mathjax/src/bundle/tex-svg.js");
    startupMathJax =
      (globalThis as unknown as { MathJax?: MathJaxStartupBundle }).MathJax ??
      null;
    if (startupMathJax?.startup?.promise) {
      await startupMathJax.startup.promise;
    }
    initialized = true;
    return;
  } catch {
    // Fall through to module-based initialization below.
  }

  // 3) Fall back to the module-based initialization (mathjax v3/v4 module layout).
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

export async function renderTexToSvg(
  texSource: string,
): Promise<{ svg: string; accessibleText: string }> {
  await init();
  // If a startup bundle (v4) is available, use its promise-based API
  // and startup adaptor to produce a clean serialized SVG.
  let accessibleText = texSource; // Fallback accessible text is the raw TeX source.
  if (startupMathJax?.tex2svgPromise) {
    try {
      const node = await startupMathJax.tex2svgPromise(texSource, {
        display: false,
      });
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

        console.log("Generated SVG (startup bundle):", svg);
        return { svg, accessibleText };
      }
    } catch (err) {
      console.error("MathJax startup render error:", err);
      // Fall through to module-based rendering.
    }
  }

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
