"use client";

import React from "react";

interface Props {
  playerName: string;
}

export default function WatchingBanner({ playerName }: Props) {
  return (
    <div
      style={{
        border: "2px dashed var(--ink-muted, #999)",
        borderRadius: 14,
        padding: "16px 20px",
        background: "var(--paper-2, #f7f4ee)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 24,
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1.1,
        }}
      >
        {playerName} is solving…
      </div>
      <div
        style={{
          fontFamily: "var(--font-kalam), cursive",
          fontSize: 12,
          color: "var(--ink-soft)",
          marginTop: 6,
        }}
      >
        watch them sweat — bomb may come back
      </div>
    </div>
  );
}
