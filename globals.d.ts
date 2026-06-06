declare module "*.css" {}

declare module "*.svg?react" {
  import React from "react";
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

// Vite import.meta.glob type declarations
interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob<Module = unknown>(
    pattern: string,
    options?: { eager?: boolean }
  ): Record<string, Module | (() => Promise<Module>)>;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}
