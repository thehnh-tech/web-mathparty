"use client";

import React from "react";

interface Props {
  round: number | null;
  subject: string;
  onClose: () => void;
}

export default function RoomTopBar({ round, subject, onClose }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      {/* Round pill */}
      <div
        style={{
          minWidth: 44,
          padding: "4px 12px",
          border: "2px solid var(--ink)",
          borderRadius: 999,
          background: "var(--paper)",
          fontFamily: "var(--font-kalam), cursive",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--ink)",
          textAlign: "center",
        }}
      >
        {round ? `R${round}` : "—"}
      </div>

      {/* Subject */}
      <div
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--ink)",
          letterSpacing: 0.3,
          padding: "0 6px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {subject}
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="leave room"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--paper)",
          border: "none",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
