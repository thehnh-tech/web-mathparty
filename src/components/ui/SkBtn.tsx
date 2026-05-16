"use client";

import React from "react";

type SkBtnVariant = "primary" | "accent" | "ghost";

interface SkBtnProps {
  variant?: SkBtnVariant;
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}

const styles: Record<SkBtnVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--ink)",
    color: "var(--paper)",
    border: "2px solid var(--ink)",
    boxShadow: "3px 3px 0 var(--ink)",
  },
  accent: {
    backgroundColor: "var(--accent)",
    color: "#fff",
    border: "2px solid var(--ink)",
    boxShadow: "3px 3px 0 var(--ink)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--ink)",
    border: "none",
    boxShadow: "none",
  },
};

export default function SkBtn({
  variant = "primary",
  children,
  onClick,
  fullWidth = false,
  disabled = false,
  type = "button",
}: SkBtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        display: "block",
        width: fullWidth ? "100%" : "auto",
        borderRadius: "8px",
        padding: "11px 18px",
        fontFamily: "var(--font-kalam), cursive",
        fontSize: "16px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textAlign: "center",
        transition: "transform 80ms, box-shadow 80ms",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translate(1px, 1px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            variant === "ghost"
              ? "none"
              : "2px 2px 0 var(--ink)";
        }
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          styles[variant].boxShadow as string;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          styles[variant].boxShadow as string;
      }}
    >
      {children}
    </button>
  );
}
