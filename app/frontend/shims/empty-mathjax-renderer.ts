// Minimal shim to bypass @khanacademy/mathjax-renderer when we want
// to avoid pulling in its MathJax v3-based loader at runtime.
// Importing this module produces no side-effects.

import React from "react";

// Provide a no-op renderer component to satisfy any imports that
// destructure `MathJaxRenderer` or similar. Keep it as a React
// component so usage sites that render it don't error.
export const MathJaxRenderer: React.FC = () => null;

// Export a minimal `SpeechRuleEngine` facade so packages that import
// `{ SpeechRuleEngine } from '@khanacademy/mathjax-renderer'` (e.g.
// @khanacademy/math-input) can call `SpeechRuleEngine.setup(locale)`.
// This implementation lazily attempts to load the `speech-rule-engine`
// npm module first, and falls back to the bundled copy under
// `/mathjax/a11y/sre.js` (copied to `public/mathjax`). If neither is
// available, it returns a no-op object whose `texToSpeech` simply
// returns the input string.
export const SpeechRuleEngine = {
  async setup(locale = "en") {
    // Try the installed npm package first.
    try {
      // The same import path used elsewhere in this repo.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sreModule = await import("speech-rule-engine/js/common/system.js");
      if (sreModule && typeof sreModule.setupEngine === "function") {
        await sreModule.setupEngine({ locale, modality: "speech" });
        if (typeof sreModule.engineReady === "function") {
          await sreModule.engineReady();
        }
        return {
          texToSpeech: (m: any) => {
            const anyMod: any = sreModule;
            if (typeof anyMod.toSpeech === "function")
              return anyMod.toSpeech(String(m));
            if (typeof anyMod.texToSpeech === "function")
              return anyMod.texToSpeech(String(m));
            return String(m);
          },
        };
      }
    } catch (e) {
      // continue to fallback
    }

    // Fallback: try the bundled SRE copied to `/public/mathjax/a11y/sre.js`.
    try {
      const base = "/mathjax";
      const mod = await import(`${base}/a11y/sre.js`);
      // The bundled script may attach itself to globalThis in various ways.
      const globalSRE =
        (globalThis as any).SRE || (globalThis as any).sre || mod || {};
      if (globalSRE && typeof globalSRE.setup === "function") {
        await globalSRE.setup(locale);
        return {
          texToSpeech: (m: any) =>
            (typeof globalSRE.texToSpeech === "function" &&
              globalSRE.texToSpeech(String(m))) ||
            String(m),
        };
      }
    } catch (e) {
      // ignore
    }

    // Final fallback: no-op
    return { texToSpeech: (m: any) => String(m) };
  },
};

export default { MathJaxRenderer, SpeechRuleEngine };
