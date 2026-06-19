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
// Type for SRE module
interface SreModule {
  setupEngine: (options: { locale: string; modality: string }) => Promise<void>;
  engineReady: () => Promise<void>;
  toSpeech: (m: string) => string;
  texToSpeech: (m: string) => string;
}

// Type for global SRE
interface GlobalSRE {
  setup: (locale: string) => Promise<void>;
  texToSpeech: (m: string) => string;
}

export const SpeechRuleEngine = {
  async setup(locale = "en") {
    // Try the installed npm package first.
    try {
      // The same import path used elsewhere in this repo.
      const sreModule = await import("speech-rule-engine/js/common/system.js");
      const sre = sreModule as unknown as SreModule;
      if (sre && typeof sre.setupEngine === "function") {
        await sre.setupEngine({ locale, modality: "speech" });
        if (typeof sre.engineReady === "function") {
          await sre.engineReady();
        }
        return {
          texToSpeech: (m: string) => {
            if (typeof sre.toSpeech === "function")
              return sre.toSpeech(String(m));
            if (typeof sre.texToSpeech === "function")
              return sre.texToSpeech(String(m));
            return String(m);
          },
        };
      }
    } catch {
      // continue to fallback
    }

    // Fallback: try the bundled SRE copied to `/public/mathjax/a11y/sre.js`.
    try {
      const base = "/mathjax";
      const mod = await import(`${base}/a11y/sre.js`);
      // The bundled script may attach itself to globalThis in various ways.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalObj = globalThis as any;
      const globalSRE = (globalObj.SRE ||
        globalObj.sre ||
        mod ||
        {}) as GlobalSRE;
      if (globalSRE && typeof globalSRE.setup === "function") {
        await globalSRE.setup(locale);
        return {
          texToSpeech: (m: string) =>
            (typeof globalSRE.texToSpeech === "function" &&
              globalSRE.texToSpeech(String(m))) ||
            String(m),
        };
      }
    } catch {
      // ignore
    }

    // Final fallback: no-op
    return { texToSpeech: (m: string) => String(m) };
  },
};

export default { MathJaxRenderer, SpeechRuleEngine };
