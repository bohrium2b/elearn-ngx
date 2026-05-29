import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import RubyPlugin from "vite-plugin-ruby";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Integrates with the vite_rails gem – reads config/vite.json
    RubyPlugin(),

    // Enables fast JSX refresh and Babel-based transforms for React
    react(),
  ],

  resolve: {
    alias: {
      // Allows clean imports like: import { Foo } from "@/components/Foo"
      "@": path.resolve(__dirname, "app/frontend"),
    },
  },

  build: {
    // Source-maps in development help with debugging
    sourcemap: true,
  },
});
