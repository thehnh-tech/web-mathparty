"use client";

import React from "react";

interface SkInputProps {
  label?: string;
  placeholder?: string;
  prefix?: string;
  helper?: string;
  fontMono?: boolean;
  value: string;
  onChange: (v: string) => void;
  statusBadge?: React.ReactNode;
  type?: string;
}

export default function SkInput({
  label,
  placeholder,
  prefix,
  helper,
  fontMono = false,
  value,
  onChange,
  statusBadge,
  type = "text",
}: SkInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label
          style={{
            fontSize: "13px",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-kalam), cursive",
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          border: "2px solid var(--ink)",
          borderRadius: "8px",
          padding: "11px 12px",
          backgroundColor: "var(--paper)",
        }}
      >
        {prefix && (
          <span
            style={{
              color: "var(--ink-muted)",
              fontFamily: fontMono
                ? "var(--font-jetbrains-mono), monospace"
                : "var(--font-kalam), cursive",
              fontSize: "14px",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontFamily: fontMono
              ? "var(--font-jetbrains-mono), monospace"
              : "var(--font-kalam), cursive",
            fontSize: "14px",
            color: "var(--ink)",
          }}
        />
        {statusBadge}
      </div>
      {helper && (
        <span
          style={{
            fontSize: "12px",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-kalam), cursive",
          }}
        >
          {helper}
        </span>
      )}
    </div>
  );
}
