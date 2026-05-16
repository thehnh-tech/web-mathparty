"use client";

import React from "react";
import { Player } from "@/lib/game-types";

interface Props {
  player: Player;
  maxLives: number;
  isMe: boolean;
  isCurrent: boolean;
  isYouLabel?: boolean;
  justAnsweredCorrect?: boolean | null;
}

export default function PlayerSlot({
  player,
  maxLives,
  isMe,
  isCurrent,
  isYouLabel,
  justAnsweredCorrect,
}: Props) {
  const dim = player.eliminated;
  const showHearts = !dim;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        opacity: dim ? 0.35 : 1,
        position: "relative",
      }}
    >
      {/* Hearts */}
      <div
        style={{
          display: "flex",
          gap: 2,
          fontSize: 12,
          minHeight: 14,
          color: "var(--accent, #d34b3a)",
          lineHeight: 1,
        }}
        aria-label="lives"
      >
        {showHearts &&
          Array.from({ length: maxLives }).map((_, i) =>
            i < player.lives ? (
              <span key={i}>♥</span>
            ) : (
              <span key={i} style={{ opacity: 0.18 }}>
                ♥
              </span>
            )
          )}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "var(--font-kalam), cursive",
          fontSize: 12,
          color: "var(--ink)",
          maxWidth: 64,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontStyle: dim ? "italic" : "normal",
        }}
      >
        {isYouLabel ? "You" : player.handle}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: `2px solid ${
            isCurrent ? "var(--accent, #d34b3a)" : "var(--ink)"
          }`,
          background: isMe ? "var(--ink)" : "var(--paper)",
          color: isMe ? "var(--paper)" : "var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 16,
          fontWeight: 700,
          boxShadow: isCurrent
            ? "0 0 0 3px rgba(211,75,58,0.18)"
            : isMe
            ? "1.5px 1.5px 0 var(--ink-soft)"
            : "none",
          transition: "box-shadow 200ms",
        }}
      >
        {player.initial.slice(0, 2)}
      </div>

      {/* Just-answered marker */}
      {justAnsweredCorrect != null && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            fontSize: 14,
            color: justAnsweredCorrect ? "#0a8a0a" : "#c33",
            background: "var(--paper)",
            borderRadius: "50%",
            padding: "0 3px",
            border: "1px solid currentColor",
            lineHeight: 1,
          }}
        >
          {justAnsweredCorrect ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}
