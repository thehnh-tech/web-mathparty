"use client";

import React, { useState } from "react";
import { Player } from "@/lib/game-types";

interface Props {
  code: string;
  subject: string;
  players: Player[];
  myId: string | null;
  maxSlots: number;
  isHost: boolean;
  onStart: () => void | Promise<void>;
  onClose: () => void;
}

export default function WaitingRoom({
  code,
  subject,
  players,
  myId,
  maxSlots,
  isHost,
  onStart,
  onClose,
}: Props) {
  const [copied, setCopied] = useState(false);
  const canStart = isHost && players.length >= 2;

  function copyCode() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // Pad with empty slots for the visual grid
  const visualSlots: (Player | null)[] = Array.from({ length: maxSlots }, (_, i) => players[i] ?? null);

  return (
    <div
      className="waiting-room"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "16px 18px 28px",
        minHeight: "100dvh",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        className="waiting-room-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-caveat), cursive",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--ink)",
            lineHeight: 1,
          }}
        >
          {subject}
        </div>
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
          }}
        >
          ✕
        </button>
      </div>

      {/* Code card */}
      <div
        className="waiting-room-code"
        style={{
          border: "2.5px solid var(--ink)",
          borderRadius: 18,
          padding: "20px 16px 18px",
          background: "var(--paper)",
          textAlign: "center",
          boxShadow: "3px 3px 0 var(--ink)",
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 11,
            color: "var(--ink-soft)",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          room code
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {code.split("").map((c, i) => (
            <span
              key={i}
              style={{
                width: 36,
                height: 44,
                border: "2px solid var(--ink)",
                borderRadius: 8,
                background: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 24,
                fontWeight: 700,
                color: "var(--ink)",
                boxShadow: "1.5px 1.5px 0 var(--ink)",
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <button
          onClick={copyCode}
          style={{
            border: "1.5px dashed var(--ink-muted, #999)",
            borderRadius: 999,
            background: "transparent",
            color: "var(--ink-soft)",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 12,
            padding: "4px 14px",
            cursor: "pointer",
          }}
        >
          {copied ? "copied ✓" : "copy code"}
        </button>
      </div>

      {/* Players progress */}
      <div className="waiting-room-players">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            joined
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 12,
              color: "var(--ink-soft)",
            }}
          >
            {players.length}/{maxSlots}
          </div>
        </div>

        {/* Slots grid — 4 cols on >= 360px, 3 cols below to avoid overflow */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
            gap: 8,
          }}
        >
          {visualSlots.map((p, i) => (
            <SlotCard key={i} player={p} isMe={p?.userId === myId} />
          ))}
        </div>
      </div>

      {/* Spacer pushes start button down */}
      <div className="waiting-room-spacer" style={{ flex: 1 }} />

      {/* Start / waiting */}
      {isHost ? (
        <button
          className="waiting-room-action"
          onClick={onStart}
          disabled={!canStart}
          style={{
            border: "2.5px solid var(--ink)",
            borderRadius: 14,
            padding: "16px",
            background: canStart ? "var(--ink)" : "var(--ink-muted, #999)",
            color: "var(--paper)",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 17,
            fontWeight: 700,
            cursor: canStart ? "pointer" : "not-allowed",
            boxShadow: canStart ? "3px 3px 0 var(--ink-soft)" : "none",
          }}
        >
          {canStart
            ? "start game →"
            : `need ${2 - players.length} more player${
                2 - players.length === 1 ? "" : "s"
              }`}
        </button>
      ) : (
        <div
          className="waiting-room-action"
          style={{
            textAlign: "center",
            fontFamily: "var(--font-kalam), cursive",
            fontSize: 14,
            color: "var(--ink-soft)",
            fontStyle: "italic",
            padding: 12,
          }}
        >
          waiting for host to start…
        </div>
      )}
    </div>
  );
}

function SlotCard({ player, isMe }: { player: Player | null; isMe: boolean }) {
  if (!player) {
    return (
      <div
        style={{
          aspectRatio: "1 / 1.05",
          border: "2px dashed var(--ink-muted, #ccc)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-caveat), cursive",
          color: "var(--ink-muted, #aaa)",
          fontSize: 22,
          minWidth: 0,
        }}
      >
        ?
      </div>
    );
  }
  return (
    <div
      style={{
        aspectRatio: "1 / 1.05",
        border: "2px solid var(--ink)",
        borderRadius: 12,
        background: isMe ? "var(--ink)" : "var(--paper)",
        color: isMe ? "var(--paper)" : "var(--ink)",
        boxShadow: "2px 2px 0 var(--ink)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: 6,
        minWidth: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "2px solid currentColor",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-caveat), cursive",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {player.initial.slice(0, 2)}
      </div>
      <div
        style={{
          fontFamily: "var(--font-kalam), cursive",
          fontSize: 11,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {isMe ? "You" : player.handle}
      </div>
      {player.isHost && (
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 8,
            opacity: 0.8,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          host
        </div>
      )}
    </div>
  );
}
