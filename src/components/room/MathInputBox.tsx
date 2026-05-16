"use client";

import React from "react";
import Latex from "@/components/Latex";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function MathInputBox({
  value,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  const showPreview = value.trim().length > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* LaTeX preview */}
      <div
        style={{
          minHeight: 50,
          padding: "10px 12px",
          border: "2px dashed var(--ink-muted, #999)",
          borderRadius: 10,
          background: "var(--paper-2, #f7f4ee)",
          textAlign: "center",
          fontSize: 18,
          color: "var(--ink)",
        }}
      >
        {showPreview ? (
          <Latex>{value}</Latex>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-kalam), cursive",
              color: "var(--ink-soft)",
              fontSize: 13,
            }}
          >
            preview appears here · type LaTeX
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim() && !disabled) onSubmit();
          }}
          disabled={disabled}
          placeholder="\frac{5}{3}"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            flex: 1,
            border: "2px solid var(--ink)",
            borderRadius: 10,
            padding: "12px 14px",
            background: "var(--paper)",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 14,
            color: "var(--ink)",
            outline: "none",
            boxShadow: "2px 2px 0 var(--ink)",
          }}
        />
        <button
          onClick={() => !disabled && value.trim() && onSubmit()}
          disabled={disabled || !value.trim()}
          style={{
            border: "2px solid var(--ink)",
            borderRadius: 10,
            padding: "0 18px",
            background:
              disabled || !value.trim()
                ? "var(--ink-muted, #999)"
                : "var(--accent, #d34b3a)",
            color: "#fff",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 18,
            fontWeight: 700,
            cursor: disabled || !value.trim() ? "default" : "pointer",
            boxShadow:
              disabled || !value.trim() ? "none" : "2px 2px 0 var(--ink)",
          }}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
