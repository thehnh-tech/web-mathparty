"use client";

import React, { useMemo } from "react";
import { Player, LastAnswer } from "@/lib/game-types";
import PlayerSlot from "./PlayerSlot";
import BombCenter from "./BombCenter";

interface Props {
  players: Player[];
  myId: string | null;
  currentPlayerId: string | null;
  maxLives: number;
  lastAnswer: LastAnswer | null;
  bombExplodeAt: number | null;
}

// 3x3 grid: 8 perimeter slots + bomb at center.
// Indexes correspond to grid cells (col, row), bot-center reserved for "me".
type Slot = { col: number; row: number };

const SLOTS_FOR_OTHERS: Slot[] = [
  { col: 1, row: 0 }, // top-center
  { col: 0, row: 0 }, // top-left
  { col: 2, row: 0 }, // top-right
  { col: 0, row: 1 }, // mid-left
  { col: 2, row: 1 }, // mid-right
  { col: 0, row: 2 }, // bot-left
  { col: 2, row: 2 }, // bot-right
];

const ME_SLOT: Slot = { col: 1, row: 2 };

// Center coordinates for each slot (% of container)
function center(s: Slot): { x: number; y: number } {
  return { x: s.col * 33.333 + 16.667, y: s.row * 33.333 + 16.667 };
}

export default function PlayerRing({
  players,
  myId,
  currentPlayerId,
  maxLives,
  lastAnswer,
  bombExplodeAt,
}: Props) {
  const layout = useMemo(() => {
    const me = players.find((p) => p.userId === myId) ?? null;
    const others = players
      .filter((p) => p.userId !== myId)
      .sort((a, b) => a.userId.localeCompare(b.userId));

    const placed: Array<{ player: Player; slot: Slot; isMe: boolean }> = [];
    if (me) placed.push({ player: me, slot: ME_SLOT, isMe: true });
    others.forEach((p, i) => {
      const slot = SLOTS_FOR_OTHERS[i];
      if (slot) placed.push({ player: p, slot, isMe: false });
    });
    return placed;
  }, [players, myId]);

  const activeSlot = layout.find(
    (l) => l.player.userId === currentPlayerId
  )?.slot;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        maxWidth: 360,
        margin: "0 auto",
      }}
    >
      {/* Clock-hand SVG overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {activeSlot &&
          (() => {
            const { x, y } = center(activeSlot);
            return (
              <line
                x1={50}
                y1={50}
                x2={x}
                y2={y}
                stroke="var(--accent, #d34b3a)"
                strokeWidth={1.2}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })()}
      </svg>

      {/* 3x3 grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 1fr)",
        }}
      >
        {layout.map(({ player, slot, isMe }) => {
          const isCurrent = player.userId === currentPlayerId;
          const justAnswered = lastAnswer?.userId === player.userId;
          return (
            <div
              key={player.userId}
              style={{
                gridColumn: slot.col + 1,
                gridRow: slot.row + 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlayerSlot
                player={player}
                maxLives={maxLives}
                isMe={isMe}
                isYouLabel={isMe}
                isCurrent={isCurrent}
                justAnsweredCorrect={
                  justAnswered ? lastAnswer!.correct : null
                }
              />
            </div>
          );
        })}

        {/* Bomb in center */}
        <div
          style={{
            gridColumn: 2,
            gridRow: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BombCenter
            bombExplodeAt={bombExplodeAt}
            exploding={lastAnswer?.cause === "explosion"}
          />
        </div>
      </div>
    </div>
  );
}
