import React from "react";
import SkBtn from "@/components/ui/SkBtn";

interface OnbCTAProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "accent";
  secondaryLabel?: string;
  onSecondary?: () => void;
  disabled?: boolean;
}

export default function OnbCTA({
  label,
  onClick,
  variant = "accent",
  secondaryLabel,
  onSecondary,
  disabled = false,
}: OnbCTAProps) {
  return (
    <div style={{ marginTop: "auto", paddingTop: "24px" }}>
      <SkBtn variant={variant} fullWidth onClick={onClick} disabled={disabled}>
        {label}
      </SkBtn>
      {secondaryLabel && (
        <button
          onClick={onSecondary}
          style={{
            display: "block",
            width: "100%",
            marginTop: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: "13px",
            color: "var(--ink-soft)",
            textDecoration: "underline",
            textAlign: "center",
          }}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}
