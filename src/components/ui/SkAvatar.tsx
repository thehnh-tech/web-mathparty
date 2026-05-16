import React from "react";

interface SkAvatarProps {
  initials: string;
  size?: number;
  dark?: boolean;
}

export default function SkAvatar({ initials, size = 48, dark = false }: SkAvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid var(--ink)",
        backgroundColor: dark ? "var(--ink)" : "var(--paper)",
        color: dark ? "var(--paper)" : "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-caveat), cursive",
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        boxShadow: "3px 3px 0 var(--ink)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
