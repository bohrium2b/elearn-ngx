// Ensure `global` and `window` exist for libraries that expect a Node-like
// global variable. This must run before MathJax modules are imported.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as any;

if (typeof globalObj.global === "undefined") {
  try {
    globalObj.global = globalObj;
  } catch {
    // ignore
  }
}

if (typeof globalObj.window === "undefined") {
  try {
    globalObj.window = globalObj;
  } catch {
    // ignore
  }
}

// Provide a minimal MathJax config if one isn't present yet. This helps
// combined bundles determine where to load components from when they
// initialize. We'll point `mathjax` to the public `/mathjax` path which
// is populated by the Vite build (see vite.config.ts static copy).
if (typeof globalThis.MathJax === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).MathJax = {
    loader: {
      paths: { mathjax: "/mathjax" },
      require: (file: string) => import(file),
      // Provide a minimal `preLoad` implementation expected by some
      // MathJax consumers (e.g. bundles that call `MathJax.loader.preLoad`).
      preLoad: (...modules: string[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (globalThis as any).MathJax.loader as any;
        if (!L || typeof L.require !== "function") return Promise.resolve([]);
        return Promise.all(modules.map((m) => L.require(m)));
      },
    },
  };
}

// Static import of the MathJax v4 combined bundle. This ensures the
// v4 startup bundle and its worker files are included in the compiled
// assets when `@mathjax/src` is installed. It must be present for this
// import to succeed; install with `yarn add @mathjax/src`.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@mathjax/src/bundle/tex-svg.js");
} catch {
  // If the package isn't installed, ignore — loader will fall back.
}

export default null;
