import { default as ReactMarkdown } from "react-markdown";
// We pre-render TeX to SVG before passing to ReactMarkdown.
import remarkGfm from "remark-gfm";
import remarkGemoji from "remark-gemoji";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import TeX from "./TeX";
import "primer-markdown/build/build.css";
import "@fontsource/noto-serif/index.css"; 
import "@fontsource/roboto";
import "highlight.js/styles/github.css"; // Import a highlight.js theme
import React, { useRef, useState, useEffect, memo } from "react";

export interface MarkdownProps {
  children: React.ReactNode;
  fontFamily?: "serif" | "sans-serif"
}

const Markdown: React.FC<MarkdownProps> = memo(({ children, fontFamily }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    function escapeHtml(s: string) {
      return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function processMath(input: string) {
      const ESC = "__ESCAPED_DOLLAR__";
      input = input.replace(/\\\$/g, ESC);

      const displayRe = /\$\$([\s\S]+?)\$\$/g;
      let out = "";
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = displayRe.exec(input)) !== null) {
        out += input.slice(last, m.index);
        const tex = String(m[1]);
        out += `<tex-display>${escapeHtml(tex)}</tex-display>`;
        last = m.index + m[0].length;
      }
      out += input.slice(last);

      const inlineRe = /\$([^\$\n]+?)\$/g;
      let finalOut = "";
      last = 0;
      while ((m = inlineRe.exec(out)) !== null) {
        finalOut += out.slice(last, m.index);
        const tex = String(m[1]);
        finalOut += `<tex-inline>${escapeHtml(tex)}</tex-inline>`;
        last = m.index + m[0].length;
      }
      finalOut += out.slice(last);

      finalOut = finalOut.replace(new RegExp(ESC, "g"), "\\$");
      return Promise.resolve(finalOut);
    }

    const raw = typeof children === "string" ? children : String(children);
    processMath(raw).then((s) => {
      if (mounted) setProcessed(s);
    });

    return () => {
      mounted = false;
    };
  }, [children]);

  return (
    <div
      className="markdown-body"
      style={{ fontFamily: fontFamily === "sans-serif" ? "Roboto, sans-serif" : "Noto Serif, serif", position: "relative" }}
      ref={containerRef}
    >
      <ReactMarkdown
        // We pre-render math into raw HTML above. Allow injected HTML
        // via `rehypeRaw` and keep highlighting. Map placeholder tags
        // to the `TeX` component so math is rendered as a React node.
        remarkPlugins={[remarkGfm, remarkGemoji]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={
          {
            "tex-inline": ({ children }: { children?: React.ReactNode }) => {
              const text = React.Children.toArray(children).join("");
              return <TeX>{String(text)}</TeX>;
            },
            "tex-display": ({ children }: { children?: React.ReactNode }) => {
              const text = React.Children.toArray(children).join("");
              return (
                <div className="math display">
                  <TeX>{String(text)}</TeX>
                </div>
              );
            },
          } as any
        }
      >
        {processed === null
          ? typeof children === "string"
            ? children
            : String(children)
          : processed}
      </ReactMarkdown>
    </div>
  );
});

export default Markdown;
