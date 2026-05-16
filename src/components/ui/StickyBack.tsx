"use client";

import { useRouter } from "next/navigation";

interface StickyBackProps {
  href?: string;
  label?: string;
}

export default function StickyBack({ href = "/lobby", label = "lobby" }: StickyBackProps) {
  const router = useRouter();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "var(--paper)",
        borderBottom: "1.5px solid rgba(26,26,26,0.1)",
        padding: "12px 20px 10px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => router.push(href)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "var(--font-caveat), cursive",
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--ink)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1 }}>←</span>
        {label}
      </button>
    </div>
  );
}
