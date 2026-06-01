import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { CHTML } from "mathjax-full/js/output/chtml.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";

let initialized = false;
let adaptor: any = null;
let svgDoc: any = null;
let chtmlDoc: any = null;
// If a combined v4 startup bundle is present, use it (provides
// MathJax.startup and promise-based helpers). This will generally
// produce correct SVG output via the startup adaptor's serializer.
let startupMathJax: any = null;

async function init() {
  if (initialized) return;

  // 1) Prefer an already-loaded global MathJax startup bundle (v4).
  if ((globalThis as any).MathJax && (globalThis as any).MathJax.startup) {
    startupMathJax = (globalThis as any).MathJax;
    if (startupMathJax.startup && startupMathJax.startup.promise) {
      await startupMathJax.startup.promise;
    }
    initialized = true;
    return;
  }

  // 2) Try to load a v4 combined bundle if available (e.g. @mathjax/src).
  try {
    // This dynamic import may fail if the bundle/package isn't installed.
    await import("@mathjax/src/bundle/tex-svg.js");
    startupMathJax = (globalThis as any).MathJax;
    if (
      startupMathJax &&
      startupMathJax.startup &&
      startupMathJax.startup.promise
    ) {
      await startupMathJax.startup.promise;
    }
    initialized = true;
    return;
  } catch (err) {
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
  if (startupMathJax) {
    try {
      const node = await startupMathJax.tex2svgPromise(texSource, {
        display: false,
      });
      const adaptor = startupMathJax.startup.adaptor;
      // Prefer adaptor.innerHTML to capture the entire serialized output
      // (handles cases where MathJax produces multiple sibling nodes).
      let svg = adaptor.innerHTML(node);
      if (!svg) {
        const svgEl = adaptor.tags(node, "svg")[0];
        svg = adaptor.serializeXML(svgEl);
      }

      if (typeof startupMathJax.tex2mmlPromise === "function") {
        const mml = await startupMathJax.tex2mmlPromise(texSource, {
          display: false,
        });
        accessibleText = stripTags(String(mml)) || texSource;

        // Try to generate a speech string from MathML using SRE. First
        // attempt to import the npm package; if absent, try the
        // bundled copy under the configured MathJax path (e.g. /mathjax).
        try {
          let sreModule: any;
          try {
            // Preferred: installed package
            sreModule = await import("speech-rule-engine/js/common/system.js");
          } catch (e) {
            // Fallback: bundled copy under the MathJax loader path
            const base =
              (startupMathJax &&
                startupMathJax.loader &&
                startupMathJax.loader.paths &&
                startupMathJax.loader.paths.mathjax) ||
              "/mathjax";
            sreModule = await import(`${base}/sre/speech-rule-engine.js`);
          }

          const { setupEngine, engineReady, toSpeech } = sreModule;
          // Default to English speech modality; could be parameterized.
          await setupEngine({ locale: "en", modality: "speech" });
          await engineReady();
          // toSpeech expects MathML string or a serialized MathML node.
          const speech = toSpeech(String(mml));
          if (speech) accessibleText = speech;
        } catch (err) {
          // SRE unavailable or failed — fall back to MathML text.
          console.debug("SRE not available for speech generation:", err);
        }
      }

      console.log("Generated SVG (startup bundle):", svg);
      return { svg, accessibleText };
    } catch (err) {
      console.error("MathJax startup render error:", err);
      // Fall through to module-based rendering.
    }
  }

  // Module-based fallback (mathjax-full / component API).
  const svgNode = svgDoc.convert(texSource, { display: false });
  const svg = adaptor.innerHTML(svgNode);

  // Use speech rule engine to generate accessible text
  // (works in only v4 with the a11y extension, not in v3).

  console.log("Generated SVG (module):", svg);
  console.log("Generated accessible text (from CHTML):", accessibleText);
  return { svg, accessibleText };
}

export default { renderTexToSvg };
