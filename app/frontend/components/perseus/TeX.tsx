import React, { useEffect, useRef } from "react";
import "./mathjax-shim";
import { renderTexToSvg } from "./mathjax-loader";
import DOMPurify from "dompurify";

type TeXProps = { children: string };

function sanitizeTeXInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

function sanitizeSvgOutput(svg: string): string {
  return DOMPurify.sanitize(svg, {
    ALLOWED_TAGS: [
      "svg",
      "g",
      "path",
      "rect",
      "circle",
      "ellipse",
      "line",
      "polyline",
      "polygon",
      "text",
      "tspan",
      "defs",
      "clipPath",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "image",
    ],
    ALLOWED_ATTR: [
      "xmlns",
      "viewBox",
      "width",
      "height",
      "x",
      "y",
      "d",
      "fill",
      "stroke",
      "stroke-width",
      "transform",
      "id",
      "class",
      "style",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "x1",
      "y1",
      "x2",
      "y2",
      "points",
      "text-anchor",
      "font-size",
      "font-family",
      "font-weight",
    ],
  });
}

function TeX({ children }: TeXProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  console.log("Rendering TeX:", children);
  useEffect(() => {
    let mounted = true;

    async function renderMath() {
      try {
        const sanitizedInput = sanitizeTeXInput(children);
        const { svg, accessibleText } = await renderTexToSvg(sanitizedInput);

        if (!mounted) return;
        const el = containerRef.current;
        if (!el) return;

        const cleanSvg = sanitizeSvgOutput(svg);
        // DO NOT USE cleanSvg - IT DOES NOT WORK! (text isn't displayed)
        el.innerHTML = svg;

        const svgEl = el.querySelector("svg");
        if (svgEl && accessibleText) {
          svgEl.setAttribute("role", "img");
          svgEl.setAttribute("aria-label", accessibleText);
          svgEl.setAttribute("focusable", "false");

          if (!el.style.position) el.style.position = "relative";

          const prev = el.querySelector(".tex-accessible");
          if (prev) prev.remove();

          const acc = document.createElement("span");
          acc.className = "tex-accessible";
          acc.textContent = accessibleText;

          Object.assign(acc.style, {
            position: "absolute",
            inset: "0px",
            color: "transparent",
            background: "transparent",
            pointerEvents: "none",
            userSelect: "text",
            WebkitUserSelect: "text",
            whiteSpace: "pre",
            width: "0px",
            fontSize: "0px",
            overflow: "hidden",
          } as Record<string, string>);

          el.appendChild(acc);
        }
      } catch (err) {
        console.error("TeX render error", err);
      }
    }

    renderMath();
    return () => {
      mounted = false;
    };
  }, [children]);

  return <span ref={containerRef} className="tex-mathjax" />;
}

export { TeX };
export default TeX;
