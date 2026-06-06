import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import RubyPlugin from "vite-plugin-ruby";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Integrates with the vite_rails gem – reads config/vite.json
    RubyPlugin(),

    // Enables fast JSX refresh and Babel-based transforms for React
    // Allows importing SVGs as React components: import { ReactComponent as Icon } from '@/images/icon.svg'
    svgr({
      // Pass options directly to the underlying SVGR instance
      svgrOptions: {
        plugins: ["@svgr/plugin-jsx"],
      },
    }),
    react(),
    // Copy MathJax source bundle into the built/public assets so worker
    // files (speech-worker.js, etc.) are served with correct MIME types.
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, "node_modules/@mathjax/src/bundle/*"),
          dest: "mathjax",
        },
      ],
    }),
  ],

  resolve: {
    alias: {
      // Allows clean imports like: import { Foo } from "@/components/Foo"
      "@": path.resolve(__dirname, "app/frontend"),
      // Remap MathJax specifiers to the installed 'mathjax' package so
      // Vite can resolve internal bare specifiers like
      // "mathjax/js/mathjax.js" at runtime. If a project uses the older
      // 'mathjax-full' layout, the loader will fall back to that.
      "mathjax/js": path.resolve(__dirname, "node_modules/mathjax/js"),
      mathjax: path.resolve(__dirname, "node_modules/mathjax"),
      // Optionally bypass the Khan Academy mathjax-renderer which pulls in
      // a MathJax v3-style loader that conflicts with the v4 bundle we use.
      // This alias points imports of @khanacademy/mathjax-renderer to a
      // no-op shim. Remove or disable this alias if you rely on the
      // renderer's functionality elsewhere.
      "@khanacademy/mathjax-renderer": path.resolve(
        __dirname,
        "app/frontend/shims/empty-mathjax-renderer.ts",
      ),
    },
  },

  build: {
    // Source-maps in development help with debugging
    sourcemap: false,

    // ── Memory Optimization: Aggressive Code Splitting ───────────────────────
    //
    // Split heavy dependencies into separate chunks to:
    // 1. Reduce peak memory usage during build
    // 2. Enable parallel processing of chunks
    // 3. Improve caching (vendor chunks change less frequently)
    // 4. Load heavy libraries only when needed (islands architecture)
    //
    rollupOptions: {
      output: {
        // manualChunks must be a function in Vite 8
        manualChunks(id) {
          // ── React Core ─────────────────────────────────────────────────────
          // React core is used by all islands but should be a single chunk
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }

          // ── MUI Core ───────────────────────────────────────────────────────
          // Split MUI into core and icons for better caching
          if (id.includes("node_modules/@mui/icons-material/")) {
            return "vendor-mui-icons";
          }
          if (
            id.includes("node_modules/@mui/material/") ||
            id.includes("node_modules/@emotion/react/") ||
            id.includes("node_modules/@emotion/styled/")
          ) {
            return "vendor-mui";
          }

          // ── Khan Academy Perseus (Ultra-fine splitting) ────────────────────
          // Split Perseus into multiple chunks for better lazy loading
          if (id.includes("node_modules/@khanacademy/perseus-score/")) {
            return "vendor-perseus-score";
          }
          if (id.includes("node_modules/@khanacademy/perseus-core/")) {
            return "vendor-perseus-core";
          }
          // Split Perseus widgets from core renderer
          if (id.includes("node_modules/@khanacademy/perseus/")) {
            return "vendor-perseus";
          }

          // ── Wonder Blocks (Individual packages) ────────────────────────────
          // Split each wonder-blocks package for granular loading
          if (id.includes("node_modules/@khanacademy/wonder-blocks-core/")) {
            return "vendor-wb-core";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-button/")) {
            return "vendor-wb-button";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-icon/")) {
            return "vendor-wb-icon";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-icon-button/")) {
            return "vendor-wb-icon-button";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-modal/")) {
            return "vendor-wb-modal";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-form/")) {
            return "vendor-wb-form";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-dropdown/")) {
            return "vendor-wb-dropdown";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-tooltip/")) {
            return "vendor-wb-tooltip";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-typography/")) {
            return "vendor-wb-typography";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-layout/")) {
            return "vendor-wb-layout";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-pill/")) {
            return "vendor-wb-pill";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-tabs/")) {
            return "vendor-wb-tabs";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-banner/")) {
            return "vendor-wb-banner";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-link/")) {
            return "vendor-wb-link";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-switch/")) {
            return "vendor-wb-switch";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-popover/")) {
            return "vendor-wb-popover";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-announcer/")) {
            return "vendor-wb-announcer";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-progress-spinner/")) {
            return "vendor-wb-progress";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-timing/")) {
            return "vendor-wb-timing";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-tokens/")) {
            return "vendor-wb-tokens";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-labeled-field/")) {
            return "vendor-wb-labeled-field";
          }
          if (id.includes("node_modules/@khanacademy/wonder-blocks-data/")) {
            return "vendor-wb-data";
          }
          if (id.includes("node_modules/@khanacademy/wonder-stuff-core/")) {
            return "vendor-wonder-stuff";
          }
          // Catch any remaining wonder-blocks packages
          if (id.includes("node_modules/@khanacademy/wonder-blocks-")) {
            return "vendor-wb-other";
          }

          // ── MathJax (Split by component) ───────────────────────────────────
          // MathJax v4 has a modular structure we can exploit
          if (id.includes("node_modules/mathjax-full/")) {
            return "vendor-mathjax-full";
          }
          if (id.includes("node_modules/@mathjax/")) {
            return "vendor-mathjax-src";
          }
          if (id.includes("node_modules/mathjax/")) {
            return "vendor-mathjax";
          }

          // ── KaTeX (Math rendering alternative) ─────────────────────────────
          if (id.includes("node_modules/katex/") || id.includes("node_modules/react-katex/")) {
            return "vendor-katex";
          }

          // ── Markdown Rendering (Split by plugin) ────────────────────────────
          if (id.includes("node_modules/rehype-katex/") || id.includes("node_modules/remark-math/")) {
            return "vendor-markdown-math";
          }
          if (id.includes("node_modules/rehype-highlight/")) {
            return "vendor-markdown-highlight";
          }
          if (id.includes("node_modules/remark-gfm/")) {
            return "vendor-markdown-gfm";
          }
          if (id.includes("node_modules/react-markdown/")) {
            return "vendor-markdown-core";
          }
          if (id.includes("node_modules/rehype-mathjax/")) {
            return "vendor-markdown-mathjax";
          }
          if (id.includes("node_modules/remark-twemoji/") || id.includes("node_modules/twemoji/")) {
            return "vendor-markdown-emoji";
          }
          if (id.includes("node_modules/remark-gemoji/")) {
            return "vendor-markdown-gemoji";
          }
          if (id.includes("node_modules/primer-markdown/")) {
            return "vendor-markdown-primer";
          }
          if (id.includes("node_modules/highlight.js/")) {
            return "vendor-highlight";
          }

          // ── jQuery (Required by Perseus) ───────────────────────────────────
          if (id.includes("node_modules/jquery/")) {
            return "vendor-jquery";
          }

          // ── Turbo/Stimulus (Loaded on every page) ──────────────────────────
          if (id.includes("node_modules/stimulus-vite-helpers/")) {
            return "vendor-stimulus-helpers";
          }
          if (id.includes("node_modules/@hotwired/")) {
            return "vendor-hotwired";
          }

          // ── Other Large Dependencies ───────────────────────────────────────
          if (id.includes("node_modules/bootstrap/")) {
            return "vendor-bootstrap";
          }
          if (id.includes("node_modules/underscore/")) {
            return "vendor-underscore";
          }
          if (id.includes("node_modules/lodash.debounce/")) {
            return "vendor-lodash-debounce";
          }
          if (id.includes("node_modules/react-window/")) {
            return "vendor-react-window";
          }
          if (id.includes("node_modules/react-transition-group/")) {
            return "vendor-react-transition";
          }
          if (id.includes("node_modules/react-popper/") || id.includes("node_modules/@popperjs/")) {
            return "vendor-popper";
          }
          if (id.includes("node_modules/prop-types/")) {
            return "vendor-prop-types";
          }
          if (id.includes("node_modules/classnames/")) {
            return "vendor-classnames";
          }
          if (id.includes("node_modules/aphrodite/")) {
            return "vendor-aphrodite";
          }
          if (id.includes("node_modules/intersection-observer/")) {
            return "vendor-intersection-observer";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-lucide";
          }
          if (id.includes("node_modules/@phosphor-icons/")) {
            return "vendor-phosphor-icons";
          }
          if (id.includes("node_modules/react-hot-toast/")) {
            return "vendor-hot-toast";
          }
          if (id.includes("node_modules/@uiw/react-md-editor/")) {
            return "vendor-md-editor";
          }
          if (id.includes("node_modules/@uiw/react-color/")) {
            return "vendor-react-color";
          }
          if (id.includes("node_modules/@testing-library/")) {
            return "vendor-testing-library";
          }

          // ── Font Source Files ──────────────────────────────────────────────
          if (id.includes("node_modules/@fontsource/")) {
            return "vendor-fontsource";
          }

          // Return undefined to let Rollup handle the chunk automatically
          return undefined;
        },
      },
    },

    // Reduce chunk size warnings threshold since we're code-splitting
    chunkSizeWarningLimit: 1500,

    // Enable CSS code splitting
    cssCodeSplit: true,
  },

  // ── Optimize Dependencies ─────────────────────────────────────────────────
  optimizeDeps: {
    // Pre-bundle these dependencies to reduce memory during dev
    include: [
      "react",
      "react-dom",
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
    ],
    // Exclude heavy dependencies from pre-bundling
    // They will be loaded on-demand by islands
    exclude: [
      "@khanacademy/perseus",
      "@khanacademy/perseus-core",
      "@khanacademy/perseus-score",
      "mathjax",
      "@mathjax/src",
      "mathjax-full",
      "katex",
      "react-katex",
    ],
  },

  define: {
    // Make the current environment available to the code as a compile-time constant.
    // This allows for dead code elimination of dev-only features in production.
    "process.env.NODE_ENV": JSON.stringify(
      process.env["NODE_ENV"] || "development",
    ),
    // Make global constants available to the code as compile-time constants.
    global: "globalThis",
  },
});
