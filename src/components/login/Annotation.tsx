import React from "react";

interface AnnotationProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Annotation({ children, style }: AnnotationProps) {
  return (
    <span
      style={{
        position: "absolute",
        fontFamily: "var(--font-caveat), cursive",
        fontSize: "13px",
        fontWeight: 600,
        color: "var(--accent)",
        lineHeight: 1.2,
        pointerEvents: "none",
        userSelect: "none",
        maxWidth: "110px",
        textAlign: "center",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
