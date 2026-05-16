import React, { useMemo } from "react";
import katex from "katex";

interface LatexProps {
  children: string;
  display?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function Latex({
  children,
  display = false,
  className,
  style,
}: LatexProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch {
      return children;
    }
  }, [children, display]);

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
