"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

// We only need 4 columns of keys + a tall "submit". Layout via grid.
//   row1: 7 8 9 - ⌫
//   row2: 4 5 6 . [submit spans 2 rows on right]
//   row3: 1 2 3 0 [continued]

export default function NumericKeypad({
  value,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  function press(key: string) {
    if (disabled) return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "-") {
      // toggle leading minus
      onChange(value.startsWith("-") ? value.slice(1) : "-" + value);
      return;
    }
    if (key === ".") {
      if (value.includes(".") || value.includes(",")) return;
      onChange((value || "0") + ".");
      return;
    }
    // digit
    onChange(value + key);
  }

  const Btn = ({
    label,
    onClick,
    style,
  }: {
    label: React.ReactNode;
    onClick: () => void;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "2px solid var(--ink)",
        borderRadius: 10,
        background: "var(--paper)",
        padding: "12px 0",
        fontFamily: "var(--font-kalam), cursive",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--ink)",
        boxShadow: disabled ? "none" : "2px 2px 0 var(--ink)",
        cursor: disabled ? "default" : "pointer",
        minHeight: 50,
        ...style,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Display strip showing current input */}
      <div
        style={{
          minHeight: 30,
          textAlign: "center",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 22,
          color: "var(--ink)",
          letterSpacing: 1,
        }}
      >
        {value || <span style={{ opacity: 0.3 }}>type your answer</span>}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {/* row 1 */}
        <Btn label="7" onClick={() => press("7")} />
        <Btn label="8" onClick={() => press("8")} />
        <Btn label="9" onClick={() => press("9")} />
        <Btn label="−" onClick={() => press("-")} />
        <Btn label="⌫" onClick={() => press("back")} />

        {/* row 2 */}
        <Btn label="4" onClick={() => press("4")} />
        <Btn label="5" onClick={() => press("5")} />
        <Btn label="6" onClick={() => press("6")} />
        <Btn label="." onClick={() => press(".")} />
        {/* Submit spans rows 2-3 */}
        <button
          onClick={() => !disabled && value.length > 0 && onSubmit()}
          disabled={disabled || value.length === 0}
          style={{
            gridColumn: "5",
            gridRow: "2 / span 2",
            border: "2px solid var(--ink)",
            borderRadius: 10,
            background:
              disabled || value.length === 0
                ? "var(--ink-muted, #999)"
                : "var(--accent, #d34b3a)",
            color: "#fff",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 22,
            fontWeight: 700,
            boxShadow:
              disabled || value.length === 0 ? "none" : "2px 2px 0 var(--ink)",
            cursor:
              disabled || value.length === 0 ? "default" : "pointer",
          }}
        >
          ✓
        </button>

        {/* row 3 */}
        <Btn label="1" onClick={() => press("1")} />
        <Btn label="2" onClick={() => press("2")} />
        <Btn label="3" onClick={() => press("3")} />
        <Btn label="0" onClick={() => press("0")} />
      </div>
    </div>
  );
}
