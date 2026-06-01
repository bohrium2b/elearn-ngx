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
        // Fixes the JSX namespace tag warning/error
        jsx: {
          throwIfNamespace: false,
        },
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
  },

  define: {
    // Make the current environment available to the code as a compile-time constant.
    // This allows for dead code elimination of dev-only features in production.
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
    // Make global constants available to the code as compile-time constants.
    global: "globalThis",
  },
});
