"use client";

import React from "react";
import { Player } from "@/lib/game-types";

interface Props {
  winner: Player | null;
  isHost: boolean;
  onPlayAgain: () => void;
  onClose: () => void;
}

export default function FinishedScreen({
  winner,
  isHost,
  onPlayAgain,
  onClose,
}: Props) {
  return (
    <div
      className="finished-room"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        gap: 18,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 48,
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        💥
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: 11,
          letterSpacing: 2,
          color: "var(--ink-soft)",
          textTransform: "uppercase",
        }}
      >
        winner
      </div>
      <div
        style={{
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 38,
          fontWeight: 700,
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        {winner ? winner.handle : "no one"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
        {isHost && (
          <button
            onClick={onPlayAgain}
            style={{
              border: "2.5px solid var(--ink)",
              borderRadius: 12,
              padding: "14px",
              background: "var(--ink)",
              color: "var(--paper)",
              fontFamily: "var(--font-kalam), cursive",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "3px 3px 0 var(--ink-soft)",
            }}
          >
            play again →
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            border: "2px dashed var(--ink-muted, #999)",
            borderRadius: 12,
            padding: "12px",
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          ← back to lobby
        </button>
      </div>
    </div>
  );
}
