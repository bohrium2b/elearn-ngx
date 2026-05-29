// eslint.config.js – Flat config (ESLint >=9)
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";

export default tseslint.config(
  // Ignore build outputs and generated files
  { ignores: ["public/vite*", "node_modules"] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React-specific rules
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React 17+ JSX transform – no need to import React
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",

      // Hooks rules
      ...reactHooks.configs.recommended.rules,

      // TypeScript-specific overrides
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
);
