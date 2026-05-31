import { default as ReactMarkdown } from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkGemoji from "remark-gemoji";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeMathjax from "rehype-mathjax/browser";
import { renderTexToSvg } from "./mathjax-loader";
import "katex/dist/katex.min.css";
import "primer-markdown/build/build.css";
import "@fontsource/noto-serif/index.css"; // Ensure you have the Noto Serif font installed
import "highlight.js/styles/github.css"; // Import a highlight.js theme
import React, { useRef, useState, useEffect } from "react";


export interface MarkdownProps {
  children: React.ReactNode;
}

const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);

  return (
    <div
      className="markdown-body"
      style={{ fontFamily: "Noto Serif, serif", position: "relative" }}
      ref={containerRef}
    >
      <ReactMarkdown
        // Keep remark math plugin so $...$ remains parsed for other cases,
        // but we already pre-render math into raw HTML above. We enable
        // `rehypeRaw` to allow our injected HTML and keep highlighting.
        remarkPlugins={[remarkMath, remarkGfm, remarkGemoji]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeMathjax]}
      >
        {processed === null
          ? typeof children === "string"
            ? children
            : String(children)
          : processed}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
