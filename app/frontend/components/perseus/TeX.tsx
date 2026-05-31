import React, { useEffect, useRef } from "react";
import "./mathjax-shim";
import { renderTexToSvg } from "./mathjax-loader";

type TeXProps = { children: string };

/**
 * TeX component — renders TeX as MathJax-produced SVG and sets an
 * accessible text string (from MathJax's MathML output when available)
 * as `aria-label` on the generated SVG.
 */
function TeX({ children }: TeXProps) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function renderMath() {
      try {
        const { svg, accessibleText } = await renderTexToSvg(children);

        if (!mounted) return;
        const el = containerRef.current;
        if (!el) return;

        // Replace container contents with the generated SVG.
        el.innerHTML = svg;

        // Attach accessible text to the SVG element and also insert
        // an invisible-but-selectable span so the text is read by
        // screen readers and included when users select/copy.
        const svgEl = el.querySelector("svg");
        if (svgEl && accessibleText) {
          svgEl.setAttribute("role", "img");
          svgEl.setAttribute("aria-label", accessibleText);
          svgEl.setAttribute("focusable", "false");

          // Ensure the container can host absolutely-positioned children.
          if (!el.style.position) el.style.position = "relative";

          // Remove any previous accessible span to avoid duplicates.
          const prev = el.querySelector(".tex-accessible");
          if (prev) prev.remove();

          // Create an invisible but selectable span with the accessible text.
          const acc = document.createElement("span");
          acc.className = "tex-accessible";
          acc.textContent = accessibleText;

          // Visually hide the text while keeping it selectable and
          // discoverable to screen readers. We overlay it on the SVG
          // but disable pointer events so it doesn't interfere.
          Object.assign(acc.style, {
            position: "absolute",
            inset: "0px",
            color: "transparent",
            background: "transparent",
            pointerEvents: "none",
            userSelect: "text",
            WebkitUserSelect: "text",
            whiteSpace: "pre",
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
